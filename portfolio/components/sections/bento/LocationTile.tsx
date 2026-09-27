'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Globe2, MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Bento.css';
import BentoCard from './BentoCard';

/** Rio Grande, RS — Brasil. Troque aqui se mudar de base. */
const BASE = { lon: -52.0986, lat: -32.035 };
const ZOOM = 3.2;

/**
 * Basemaps da CARTO servidos como estilo vetorial MapLibre.
 *
 * Positron e Dark Matter sao os mesmos temas que a CARTO desenhou e que o
 * Mapbox light-v11/dark-v11 imitam — a troca sai visualmente quase identica.
 * Sao gratuitos e nao pedem token; a licenca so exige manter a atribuicao
 * (OpenStreetMap + CARTO), que o proprio style.json ja injeta no controle.
 */
const STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;

type Scheme = keyof typeof STYLES;

/**
 * Worker de parsing de tiles, publicado por `scripts/copy-maplibre-worker.mjs`.
 *
 * Sem este ponteiro o mapa sobe vazio sob o Turbopack: a v6 monta a URL do
 * worker concatenando o nome do arquivo em runtime, o bundler nao consegue
 * rastrear isso e resolve para o modulo errado; o Next responde 404 em
 * `text/html` e o Worker recusa por MIME. O canvas, os controles e o marcador
 * aparecem normalmente, mas nenhum tile e parseado — nem a style.json chega a
 * ser buscada. O cabecalho daquele script explica o mecanismo por inteiro.
 */
const WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';

/**
 * O AttributionControl compacto do MapLibre nasce ABERTO: na primeira medida
 * ele marca o <details> com `open` e adiciona `maplibregl-compact-show`, o que
 * deixa o balao "OpenStreetMap contributors" esticado por cima do mapa ate o
 * primeiro clique. Como a lib so repete esse passo enquanto o container ainda
 * nao tem a classe `maplibregl-compact`, tirar o estado aberto uma vez basta —
 * resize e troca de estilo nao reabrem. O botao "i" continua la, entao a
 * atribuicao exigida pela licenca segue acessivel.
 */
function collapseAttribution(root: HTMLElement | null) {
  const attrib = root?.querySelector('.maplibregl-ctrl-attrib');
  attrib?.classList.remove('maplibregl-compact-show');
  attrib?.removeAttribute('open');
}

/**
 * Mapa interativo com maplibre-gl.
 *
 * - a lib entra por `import()` dinamico, entao os ~200kb so baixam quando o
 *   card monta no cliente — nao pesam no bundle inicial da home;
 * - `scrollZoom` fica desligado de proposito: rolar a pagina por cima do card
 *   nao pode virar zoom no mapa. Arrastar e os botoes +/- continuam valendo;
 * - a troca claro/escuro chama `setStyle`, o marcador sobrevive porque e um
 *   elemento DOM e nao faz parte do estilo;
 * - se o CDN de tiles cair, o card degrada para um fundo neutro com o pin.
 */
export default function LocationTile() {
  const t = useTranslations('bento.location');

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const scheme: Scheme = resolvedTheme === 'light' ? 'light' : 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const [failed, setFailed] = useState(false);

  /**
   * A criacao do mapa espera um `import()`, e o next-themes resolve o tema em
   * paralelo. Quem entra no claro costuma trocar de esquema DURANTE essa
   * espera: o efeito de tema roda com `mapRef.current` ainda null e nao faz
   * nada, e o efeito de criacao usaria o `scheme` congelado no closure — o
   * mapa nasceria escuro dentro do site claro. O ref carrega sempre o valor
   * atual, que e lido so depois do await.
   */
  const schemeRef = useRef<Scheme>(scheme);
  schemeRef.current = scheme;

  // ---- cria o mapa uma unica vez -----------------------------------------
  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        // maplibre-gl 6 e ESM puro e nao expoe mais default export: o
        // `.default` daqui era o default sintetico que o esModuleInterop
        // fabricava para o build CJS da v5, e na v6 vem `undefined`.
        const maplibregl = await import('maplibre-gl');
        if (cancelled || !containerRef.current || mapRef.current) return;

        // Precisa vir antes do primeiro `new Map`: e na criacao do pool de
        // workers que a lib le esta config, e ela so consulta a URL uma vez.
        maplibregl.setWorkerUrl(WORKER_URL);

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: STYLES[schemeRef.current],
          center: [BASE.lon, BASE.lat],
          zoom: ZOOM,
          scrollZoom: false,
          attributionControl: { compact: true },
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        const pin = document.createElement('div');
        pin.className = 'bento-map-pin';
        new maplibregl.Marker({ element: pin, anchor: 'center' })
          .setLngLat([BASE.lon, BASE.lat])
          .addTo(map);

        // o card so ganha altura depois do layout — garante o enquadramento
        let loaded = false;
        map.on('load', () => {
          loaded = true;
          map.resize();
          collapseAttribution(containerRef.current);
        });

        /**
         * Antes do `load`, um erro significa estilo fora do ar ou worker que
         * nao subiu: nao ha mapa nenhum para mostrar e o fallback e a resposta
         * certa. Depois do `load` os erros sao de tile solto — um 5xx do CDN,
         * a rede piscando — e trocar o mapa inteiro por um pin deixaria o card
         * pior do que o buraco de um tile faltando, ainda por cima de forma
         * permanente, ja que `failed` nunca volta.
         */
        map.on('error', () => {
          if (!loaded) setFailed(true);
        });

        mapRef.current = map;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // o estilo inicial sai do `schemeRef` (lido apos o await); trocas depois
    // disso sao tratadas no efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ---- acompanha a troca de tema -----------------------------------------
  useEffect(() => {
    mapRef.current?.setStyle(STYLES[scheme]);
  }, [scheme]);

  const showMap = mounted && !failed;

  return (
    <BentoCard
      eyebrow={t('eyebrow')}
      title={t('title')}
      align="bottom"
      contentClassName="-mx-6 -mt-6 mb-5 items-stretch justify-stretch"
    >
      <div className="relative h-[13rem] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800/60">
        <div ref={containerRef} className={showMap ? 'h-full w-full' : 'hidden'} />

        {!showMap && (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_40%,hsl(var(--muted)),transparent_70%)]">
            <MapPin className="text-primary" size={28} />
          </div>
        )}

        {/* chips flutuando por cima do mapa */}
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur dark:bg-neutral-900/85 dark:text-neutral-200">
          <MapPin size={13} className="text-primary" />
          {t('base')}
        </span>

        <span className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur dark:bg-neutral-900/85 dark:text-neutral-200">
          <Globe2 size={13} className="text-emerald-500" />
          {t('global')}
        </span>
      </div>
    </BentoCard>
  );
}
