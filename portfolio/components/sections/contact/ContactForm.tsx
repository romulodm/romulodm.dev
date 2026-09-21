'use client';

/**
 * Formulário público de contato (o do modal "Let's talk").
 *
 * Antes daqui saía um POST direto para um serviço de terceiros, com URL e
 * access key vindas de `NEXT_PUBLIC_*`. Aquelas variáveis nunca chegaram ao
 * build — o `.env` definia `NEXT_URL_EMAIL`, sem o `PUBLIC` — então o `fetch`
 * ia para string vazia, postava na própria página, recebia HTML de volta e
 * morria no `catch`. Nenhuma mensagem chegou.
 *
 * Agora o destino é `/api/contact`: caminho relativo, mesma origem, nenhuma
 * variável de ambiente envolvida. Um problema a menos por construção.
 *
 * Este componente carrega duas das oito defesas; as outras seis vivem no nginx
 * e no servidor:
 *
 *   - honeypot: campo `website`, invisível para gente;
 *   - Turnstile: token de uso único, validado do lado do servidor.
 */

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { FiAtSign, FiUser } from 'react-icons/fi';
import { MdErrorOutline } from 'react-icons/md';
import { BsSendCheck } from 'react-icons/bs';
import { CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';

import { useTurnstile } from '@/hooks/useTurnstile';
import { ContactPrivacyNotice } from '@/components/sections/contact/ContactPrivacyNotice';
import { CONTACT_TOPICS, type ContactTopicValue } from '@/lib/contact-topics';

const FIELD_CLASS =
  'py-2 bg-transparent dark:bg-neutral-900 dark:text-neutral-300 dark:placeholder-neutral-500 px-4 block w-full border border-gray-300 dark:border-neutral-700 rounded-md focus:border-primary/70 focus:outline-none';

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400';

export interface ContactFormProps {
  /**
   * Assunto já selecionado ao abrir. Serve aos atalhos de contexto — o botão
   * "reportar um bug" abre com BUG_REPORT — mas o campo continua editável: se a
   * pessoa clicou num atalho e percebe que o assunto é outro, ela troca sem
   * precisar fechar e começar de novo.
   */
  defaultTopic?: ContactTopicValue;
}

export default function ContactForm({
  defaultTopic,
}: ContactFormProps): React.JSX.Element {
  const t = useTranslations('contact');
  // `action` separa este widget do outro formulário nas analytics da
  // Cloudflare. `interaction-only` e `flexible` são os padrões do hook: a
  // caixa fica escondida até ser mesmo necessária e, quando aparece, ocupa a
  // largura do formulário em vez dos 300px fixos.
  const turnstile = useTurnstile({ action: 'contact-modal' });
  // `reset` é estável (useCallback com []); o objeto do hook não é. Depender do
  // objeto inteiro faria o efeito de limpeza rodar a cada render.
  const { reset: resetTurnstile } = turnstile;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  /**
   * String vazia é o estado "ainda não escolheu", e é o padrão quando não veio
   * assunto por contexto. Escolher um tópico por conta própria seria pior que
   * não escolher: a pessoa manda a mensagem inteira sem reparar que o campo já
   * vinha preenchido com algo que não é o caso dela, e a classificação no
   * painel passa a mentir.
   */
  const [topic, setTopic] = useState<ContactTopicValue | ''>(defaultTopic ?? '');

  /** Honeypot. Só um bot preenche isto. */
  const [website, setWebsite] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          website,
          turnstileToken: turnstile.token,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        return;
      }

      // A API devolve `{ error, message, code }`, e a mensagem já vem no idioma
      // do visitante — `getApiTranslator` resolve o locale a partir do request.
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? t('error-generic'));
      resetTurnstile();
    } catch {
      setError(t('error-generic'));
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!submitted) return;

    const timeout = setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setMessage('');
      // Volta ao assunto do contexto, não ao vazio: quem entrou pelo botão de
      // bug provavelmente vai reportar outro bug, não recomeçar do zero.
      setTopic(defaultTopic ?? '');
      resetTurnstile();
    }, 9000);

    return () => clearTimeout(timeout);
  }, [submitted, defaultTopic, resetTurnstile]);

  return (
    <div className="relative flex h-fit justify-center">
      <Script
        src={turnstile.scriptSrc}
        strategy="afterInteractive"
        onLoad={turnstile.render}
      />

      <form
        onSubmit={submit}
        className={`rounded-lg max-w-md w-full transition-all duration-300 ${submitted ? 'opacity-50 pointer-events-none scale-95' : 'opacity-100 scale-100'
          }`}
      >
        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-3.5">
            <div className="flex items-center">
              <MdErrorOutline className="flex-shrink-0 h-5 w-5 text-yellow-700" />
              <div className="ml-3">
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3.5">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              id="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${FIELD_CLASS} pl-10`}
              placeholder={t('form-name')}
            />
          </div>
        </div>

        <div className="mb-3.5">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiAtSign className="text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              required
              maxLength={160}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${FIELD_CLASS} pl-10`}
              placeholder={t('form-email')}
            />
          </div>
        </div>

        <div className="mb-3.5">
          <select
            name="topic"
            id="topic"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value as ContactTopicValue)}
            className={`${FIELD_CLASS} ${topic === '' ? 'text-gray-400 dark:text-neutral-500' : ''}`}
          >
            {/*
              `disabled` impede voltar ao vazio depois de escolher; `hidden`
              tira a linha da lista aberta, então o menu mostra só as opções de
              verdade. Os dois juntos são o jeito de dar placeholder a um
              <select> — sozinho, `disabled` ainda ocuparia uma linha cinza no
              topo do menu.

              O `required` do form usa o valor vazio: enviar sem escolher para
              na validação nativa do navegador, antes de qualquer requisição.
            */}
            <option value="" disabled hidden>
              {t('form-topic-placeholder')}
            </option>

            {CONTACT_TOPICS.map((value) => (
              <option key={value} value={value}>
                {t(`topic-${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3.5">
          <textarea
            name="message"
            id="message"
            required
            minLength={10}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={FIELD_CLASS}
            placeholder={t('form-text')}
            rows={4}
          />
        </div>

        {/*
          Honeypot. Escondido por posição, e não por `display: none` ou
          `visibility: hidden`: bots modernos pulam campos que o navegador não
          renderiza, e um honeypot que ninguém preenche não pega ninguém.
          Fora da ordem de tabulação e invisível para leitores de tela.
        */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
        >
          <label htmlFor="website">Website</label>
          <input
            type="text"
            name="website"
            id="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {/*
          Escondido, o container sai do fluxo com `absolute` — não consome
          espaço nenhum, e o botão fica exatamente a um `mb-3.5` do último campo,
          igualzinho aos campos entre si. Visível, ele volta ao fluxo com o
          mesmo `mb-3.5`, então a caixa entra com o respiro dos dois lados.

          `absolute` sem `top`/`left` mantém o elemento na posição estática que
          ele já teria, só que fora do fluxo — sem salto e sem sobreposição,
          porque escondido ele tem altura zero.

          Note que NÃO é `hidden`/`display: none`: um iframe não renderizado não
          resolve desafio nenhum, e o widget nunca conseguiria aparecer.
        */}
        <div
          ref={turnstile.hostRef}
          className={
            turnstile.visible ? 'mb-3.5 flex justify-center' : 'absolute'
          }
        />

        <div className="w-full flex justify-start">
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base text-white hover:opacity-90 transition disabled:opacity-50"
            disabled={loading || !turnstile.ready}
          >
            {loading ? (
              <CircularProgress size={20} style={{ fontSize: '2px' }} color="secondary" />
            ) : (
              t('form-button')
            )}
          </button>
        </div>

        {/*
          Abaixo do botão, não acima: é informação de apoio, não uma etapa a
          cumprir antes de enviar.
        */}
        <ContactPrivacyNotice />
      </form>

      {submitted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-neutral-950 bg-opacity-50 z-20 transition-all duration-300">
          <div className="send-email w-fit h-fit rounded-lg p-10 relative email-message">
            <BsSendCheck className="text-primary text-6xl mx-auto mb-3.5" />
            <h2 className="text-2xl dark:text-white font-bold mb-2">{t('sended-title')}</h2>
            <p className="text-gray-600 dark:text-white">{t('sended-content')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
