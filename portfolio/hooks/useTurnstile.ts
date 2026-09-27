'use client';

/**
 * Ciclo de vida do widget do Cloudflare Turnstile.
 *
 * Existe como hook porque o site tem DOIS formulários de contato — o do modal
 * (`sections/contact/ContactForm`) e o da seção espacial da home
 * (`sections/vision/Reach`) — e as regras abaixo são fáceis de errar em cada
 * cópia, especialmente a do reset.
 *
 * Uso:
 *
 *   const turnstile = useTurnstile();
 *   ...
 *   <Script src={turnstile.scriptSrc} strategy="afterInteractive"
 *           onLoad={turnstile.render} />
 *   <div ref={turnstile.hostRef} />
 *   <button disabled={!turnstile.ready}>Enviar</button>
 *   // no erro do submit: turnstile.reset()
 *
 * Nota sobre aparência: o widget é um iframe de outra origem, então NÃO dá para
 * estilizar por CSS — nem cor, nem borda, nem fonte. O que existe são os
 * parâmetros de render abaixo. Para sumir de vez com a caixa, o caminho é criar
 * um widget do tipo *Invisible* no painel da Cloudflare; isso é configuração da
 * sitekey, não código.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'auto' | 'light' | 'dark';
  size?: 'normal' | 'flexible' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
  language?: string;
  action?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/**
 * `render=explicit` em vez do modo automático.
 *
 * O modo automático varre o DOM procurando `.cf-turnstile` uma vez, quando o
 * script carrega. Um formulário que vive dentro de um modal só existe no DOM
 * depois disso — e na segunda abertura do modal o script já carregou e não
 * varre de novo. Controlando o render, cada montagem ganha o seu widget.
 */
export const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Locale do app → código de idioma que o Turnstile entende. */
const TURNSTILE_LANGUAGE: Record<string, string> = {
  pt: 'pt-br',
  en: 'en',
};

export interface UseTurnstileOptions {
  /**
   * Quando a caixa aparece.
   *
   * - `interaction-only` (padrão): fica escondida e só surge se a Cloudflare
   *   realmente precisar de um clique. É o que mantém o formulário limpo para
   *   a esmagadora maioria dos visitantes.
   * - `always`: sempre visível. Útil enquanto se depura a integração.
   * - `execute`: aparece só durante a execução do desafio.
   */
  appearance?: 'always' | 'execute' | 'interaction-only';
  /**
   * `flexible` faz a caixa acompanhar a largura do container em vez de fixar
   * 300px. Num formulário estreito é a diferença entre parecer encaixado e
   * parecer colado por cima.
   */
  size?: 'normal' | 'flexible' | 'compact';
  /** Rótulo que separa os widgets nas analytics do painel da Cloudflare. */
  action?: string;
}

export interface UseTurnstileResult {
  /** Onde o widget é desenhado. */
  hostRef: RefObject<HTMLDivElement | null>;
  /**
   * `true` enquanto a caixa está de fato na tela pedindo interação.
   *
   * Com `interaction-only` o elemento continua no DOM mesmo escondido, então
   * dar margem a ele incondicionalmente abriria um buraco entre o último campo
   * e o botão. Use isto para o espaçamento acompanhar a caixa — e prefira tirar
   * o container do fluxo (`position: absolute`) a escondê-lo com
   * `display: none`, que impediria o iframe da Cloudflare de renderizar.
   */
  visible: boolean;
  /** Token atual, ou string vazia enquanto não houver um válido. */
  token: string;
  /** `true` quando dá para enviar — ou quando o Turnstile não está configurado. */
  ready: boolean;
  /** Passe para o `onLoad` do <Script>. Idempotente. */
  render: () => void;
  /** Chame em TODO caminho de erro do submit. Ver comentário abaixo. */
  reset: () => void;
  scriptSrc: string;
  /** `false` quando não há site key — em dev sem `.env`, por exemplo. */
  enabled: boolean;
}

export function useTurnstile(
  options: UseTurnstileOptions = {},
): UseTurnstileResult {
  const { appearance = 'interaction-only', size = 'flexible', action } = options;

  const locale = useLocale();
  const { resolvedTheme } = useTheme();

  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState('');
  /**
   * `true` quando o desafio falhou (rede fora, domínio de fora da lista da
   * sitekey, extensão bloqueando o iframe) ou o token expirou.
   *
   * **Isto nunca vira mensagem na tela.** Não há nada que o visitante possa
   * fazer com essa informação, e um aviso sobre "confirmar que você não é um
   * robô" surgindo sozinho num formulário ainda em branco assusta mais do que
   * o problema que descreve. O único efeito é liberar o botão (ver `ready`):
   * a pessoa envia, o servidor recusa sem token — `/api/contact` falha closed
   * — e aí sim aparece um erro, genérico, depois de uma ação dela.
   */
  const [failed, setFailed] = useState(false);
  /*
   * Com `appearance: 'interaction-only'` a caixa nasce escondida e só aparece
   * se a Cloudflare precisar de um clique. Nos outros modos ela já nasce
   * visível — daí o valor inicial depender do modo.
   */
  const [visible, setVisible] = useState(appearance !== 'interaction-only');

  /*
   * O tema do widget segue o tema DO SITE, não o do sistema operacional.
   *
   * `theme: 'auto'` — o padrão da Cloudflare — usa `prefers-color-scheme`. Como
   * o site tem seletor próprio (next-themes, com `defaultTheme="system"` mas
   * sobrescrevível), alguém com o SO no claro e o site no escuro veria uma
   * caixa branca no meio de um modal preto. É exatamente o que faz o widget
   * parecer enxertado em vez de encaixado.
   *
   * `resolvedTheme` é `undefined` no servidor e no primeiro render do cliente.
   * Renderizar nesse meio-tempo criaria um widget no tema errado, que teria de
   * ser trocado logo em seguida — dois desafios por montagem. Por isso o render
   * espera o tema resolver; o `ThemeProvider` do `app/[locale]/layout.tsx`
   * garante que ele resolve.
   */
  const widgetTheme: 'light' | 'dark' | undefined =
    resolvedTheme === 'light' ? 'light' : resolvedTheme === 'dark' ? 'dark' : undefined;

  const render = useCallback(() => {
    if (!SITE_KEY) return;
    // Sem tema resolvido ainda: o efeito abaixo chama de novo quando resolver,
    // porque `widgetTheme` faz parte das dependências deste callback.
    if (!widgetTheme) return;
    if (!window.turnstile || !hostRef.current) return;
    // Guarda contra render duplo: `onLoad` do <Script> e o efeito abaixo podem
    // disparar os dois, e dois widgets no mesmo host quebram o reset.
    if (widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(hostRef.current, {
      sitekey: SITE_KEY,
      theme: widgetTheme,
      size,
      appearance,
      language: TURNSTILE_LANGUAGE[locale] ?? 'auto',
      ...(action ? { action } : {}),
      callback: (value) => {
        setToken(value);
        setFailed(false);
      },
      // O token vale 5 minutos. Se a pessoa abriu o formulário e voltou depois,
      // limpar o estado força um desafio novo — melhor que um submit que
      // falharia com `timeout-or-duplicate` sem explicação.
      'expired-callback': () => {
        setToken('');
        setFailed(true);
      },
      'error-callback': () => {
        setToken('');
        setFailed(true);
      },
      // Estes dois são a fonte da verdade sobre a caixa estar ocupando espaço.
      // A alternativa seria medir a altura do container com um ResizeObserver,
      // mas isso é adivinhar como a Cloudflare esconde o widget — detalhe que
      // eles não documentam e podem mudar. Os callbacks são API pública.
      'before-interactive-callback': () => setVisible(true),
      'after-interactive-callback': () => setVisible(false),
    });
  }, [widgetTheme, size, appearance, locale, action]);

  useEffect(() => {
    // Na segunda montagem o script já está na página e o `onLoad` do <Script>
    // não dispara de novo — por isso o render também é tentado aqui.
    //
    // Este efeito também é o que troca o widget de tema: `render` muda de
    // identidade quando o tema muda, a limpeza abaixo remove o widget antigo e
    // um novo nasce no tema certo. O custo é descartar um token não enviado e
    // resolver o desafio outra vez — coisa de um segundo, e só para quem troca
    // de tema no meio de uma mensagem.
    render();

    return () => {
      if (widgetIdRef.current !== null) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      // O widget novo nasce escondido; sem zerar isto, uma troca de tema feita
      // com a caixa aberta deixaria a margem sobrando.
      setVisible(appearance !== 'interaction-only');
      // O widget novo começa do zero; carregar a falha do anterior manteria o
      // botão liberado sem motivo.
      setFailed(false);
    };
  }, [render, appearance]);

  /**
   * O token é QUEIMADO na primeira validação: a Cloudflare recusa replay com
   * `timeout-or-duplicate`. Sem resetar depois de um erro, toda tentativa
   * seguinte falha e a pessoa conclui que o site está quebrado. É o erro mais
   * comum de quem integra Turnstile.
   */
  const reset = useCallback(() => {
    setToken('');
    /*
     * `failed` NÃO é limpo aqui, de propósito.
     *
     * Os dois formulários chamam `reset()` no caminho de erro do submit. Se o
     * reset zerasse `failed`, `ready` voltaria a depender só do token — que
     * acabou de ser zerado — e o botão morreria logo depois da primeira
     * tentativa, exatamente na hora em que a pessoa quer tentar de novo.
     *
     * Quem limpa `failed` é o `callback`, quando a Cloudflare devolve um token
     * novo. Se o desafio continuar falhando, ele fica `true` e o botão segue
     * liberado — o servidor recusa, que é onde a decisão pertence.
     */
    if (widgetIdRef.current !== null) window.turnstile?.reset(widgetIdRef.current);
  }, []);

  return {
    hostRef,
    token,
    visible,
    // Sem site key configurada o widget nunca renderiza e nenhum token aparece.
    // Nesse caso não bloqueamos o botão: quem decide é o servidor, que vai
    // recusar — travar o botão só esconderia o problema de configuração.
    //
    // `failed` segue a mesma regra. Um botão que nunca destrava é pior que um
    // envio recusado: o envio recusado a pessoa entende e pode repetir.
    ready: !SITE_KEY || failed || token !== '',
    render,
    reset,
    scriptSrc: TURNSTILE_SCRIPT_SRC,
    enabled: Boolean(SITE_KEY),
  };
}
