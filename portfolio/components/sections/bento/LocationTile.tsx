'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Globe2, MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import BentoCard from './BentoCard';

/** Rio Grande, RS — Brasil. Troque aqui se mudar de base. */
const BASE = { lon: -52.0986, lat: -32.035 };
const ZOOM = 3.2;

const STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const;

type Scheme = keyof typeof STYLES;

/**
 * Mapa interativo com mapbox-gl.
 *
 * - a lib entra por `import()` dinamico, entao os ~230kb so baixam quando o
 *   card monta no cliente — nao pesam no bundle inicial da home;
 * - `scrollZoom` fica desligado de proposito: rolar a pagina por cima do card
 *   nao pode virar zoom no mapa. Arrastar e os botoes +/- continuam valendo;
 * - a troca claro/escuro chama `setStyle`, o marcador sobrevive porque e um
 *   elemento DOM e nao faz parte do estilo;
 * - sem NEXT_PUBLIC_MAPBOX_TOKEN o card cai num fundo neutro com o pin.
 */
export default function LocationTile() {
  const t = useTranslations('bento.location');

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const scheme: Scheme = resolvedTheme === 'light' ? 'light' : 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('mapbox-gl').Map | null>(null);
  const [failed, setFailed] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ---- cria o mapa uma unica vez -----------------------------------------
  useEffect(() => {
    if (!mounted || !token || !containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        if (cancelled || !containerRef.current || mapRef.current) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: STYLES[scheme],
          center: [BASE.lon, BASE.lat],
          zoom: ZOOM,
          scrollZoom: false,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        const pin = document.createElement('div');
        pin.className = 'bento-map-pin';
        new mapboxgl.Marker({ element: pin, anchor: 'center' })
          .setLngLat([BASE.lon, BASE.lat])
          .addTo(map);

        // o card so ganha altura depois do layout — garante o enquadramento
        map.on('load', () => map.resize());

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
    // o estilo inicial usa o tema do primeiro render; trocas depois disso sao
    // tratadas no efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token]);

  // ---- acompanha a troca de tema -----------------------------------------
  useEffect(() => {
    mapRef.current?.setStyle(STYLES[scheme]);
  }, [scheme]);

  const showMap = Boolean(token) && mounted && !failed;

  return (
    <BentoCard
      eyebrow={t('eyebrow')}
      title={t('title')}
      align="bottom"
      contentClassName="-mx-6 -mt-6 mb-5 items-stretch justify-stretch"
    >
      <div className="relative h-[13rem] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800/60">
        {showMap ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_40%,hsl(var(--muted)),transparent_70%)]">
            <MapPin className="text-rose-500" size={28} />
          </div>
        )}

        {/* chips flutuando por cima do mapa */}
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur dark:bg-neutral-900/85 dark:text-neutral-200">
          <MapPin size={13} className="text-rose-500" />
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
