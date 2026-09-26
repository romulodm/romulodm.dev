'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import HeroIgaratipo from '@/components/HeroIgaratipo';
import FakeTimeline from './FakeTimeline';

import hillsFar from '@/public/hero/hills-far.webp';
import hillsMid from '@/public/hero/hills-mid.webp';
import hillsFront from '@/public/hero/hills-front.webp';

type GreetingKey = 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening';

// Uses the visitor's local clock (browser time zone); nothing leaves the browser.
function greetingKeyFor(hour: number): GreetingKey {
    if (hour >= 5 && hour < 12) return 'greetingMorning';
    if (hour >= 12 && hour < 18) return 'greetingAfternoon';
    return 'greetingEvening';
}

const LanyardDisplay = dynamic(() => import('@/components/lanyard/LanyardDisplay'), {
    ssr: false,
    loading: () => null,
});

const StaticCardSkeleton = () => (
    <div className="flex justify-center py-4">
        <div style={{ width: 260, height: 340 }} className="flex items-center justify-center">
            <div className="h-[240px] w-[180px] animate-pulse rounded-xl bg-white/10" />
        </div>
    </div>
);

const StaticCardDisplay = dynamic(() => import('@/components/lanyard/StaticCardDisplay'), {
    ssr: false,
    loading: () => <StaticCardSkeleton />,
});

/** Mesma escolha de glifos do Hero original. */
const LETTER_CHOICES = [2, 0, 1, 0, 1, 0, undefined, 2];

const SKY_DARK =
    'radial-gradient(200% 83% at 50% 0px, rgb(27, 34, 40) 0%, rgb(53, 63, 68) 42%, rgb(211, 151, 148) 100%)';
const SKY_LIGHT =
    'radial-gradient(200% 83% at 50% 0px, rgb(250, 250, 250) 0%, rgb(214, 222, 228) 42%, rgb(226, 170, 160) 100%)';

const GRAIN: CSSProperties = {
    backgroundImage: 'url("/grain.png")',
    backgroundSize: '100px 100px',
    backgroundRepeat: 'repeat',
    mixBlendMode: 'overlay',
};

/**
 * O veu e o grain extra cobrem a secao inteira (mesma caixa do ceu, para as cores
 * baterem pixel a pixel) e somem suavemente abaixo do igaratipo. Caixas menores
 * com borda dura criavam uma faixa visivel no meio da tela.
 */
const TOP_FADE: CSSProperties = {
    maskImage: 'linear-gradient(to bottom, black 0px, black 340px, transparent 600px)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 0px, black 340px, transparent 600px)',
};

/** Quadro de referencia do cracha: o mesmo 107vh do Hero original. */
const lanyardFrame = () => window.innerHeight * 1.07;

/** Aplica `translateY = fator * scroll` em todo `[data-parallax]` dentro da secao. */
function useLayerParallax(sectionRef: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const layers = Array.from(section.querySelectorAll<HTMLElement>('[data-parallax]')).map((el) => ({
            el,
            factor: Number(el.dataset.parallax) || 0,
        }));
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;

        const update = () => {
            frame = 0;
            const rect = section.getBoundingClientRect();
            // Fora da tela nao ha o que animar: evita escrever transform a toa.
            if (rect.bottom < 0) return;
            const offset = reduceMotion.matches ? 0 : Math.max(0, -rect.top);
            for (const { el, factor } of layers) {
                el.style.transform = `translate3d(0, ${(offset * factor).toFixed(2)}px, 0)`;
            }
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        reduceMotion.addEventListener('change', schedule);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            reduceMotion.removeEventListener('change', schedule);
        };
    }, [sectionRef]);
}

export default function Hero() {
    const t = useTranslations('home.hero');

    // The server cannot know the visitor's hour, so the greeting is resolved after
    // mount. Until then the neutral fallback is rendered invisible to avoid a flash.
    const [greetingKey, setGreetingKey] = useState<GreetingKey | null>(null);
    useEffect(() => {
        setGreetingKey(greetingKeyFor(new Date().getHours()));
    }, []);
    const sectionRef = useRef<HTMLElement>(null);
    useLayerParallax(sectionRef);

    return (
        <section ref={sectionRef} className="relative isolate w-full overflow-clip">
            {/* 1 — ceu */}
            <div aria-hidden className="absolute inset-0 dark:hidden" style={{ background: SKY_LIGHT }} />
            <div aria-hidden className="absolute inset-0 hidden dark:block" style={{ background: SKY_DARK }} />
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ ...GRAIN, opacity: 0.6 }} />

            {/* 2 — colinas distantes (0.31) */}
            <div
                aria-hidden
                data-parallax="0.31"
                className="pointer-events-none absolute inset-x-0 bottom-[-5vw] will-change-transform"
            >
                <Image src={hillsFar} alt="" priority sizes="100vw" className="h-auto w-full select-none" />
            </div>

            {/* 3 — colinas do meio (0.17) */}
            <div
                aria-hidden
                data-parallax="0.17"
                className="pointer-events-none absolute inset-x-0 bottom-[-3.2vw] will-change-transform"
            >
                <Image src={hillsMid} alt="" priority sizes="100vw" className="h-auto w-full select-none" />
            </div>

            {/* 4 — igaratipo perto da navbar. Desktop: absoluto (o cracha ocupa o miolo);
                   mobile: no fluxo, acima do cartao estatico. */}
            <div className="pointer-events-none relative z-10 mx-auto w-full max-w-4xl px-6 pt-24 md:absolute md:inset-x-0 md:top-0 md:pt-[104px]">
                <div style={{ aspectRatio: '1400 / 320' }}>
                    <span className="dark:hidden">
                        <HeroIgaratipo randomLetters={false} strokeColor="black" letterChoices={LETTER_CHOICES} />
                    </span>
                    <span className="hidden dark:inline">
                        <HeroIgaratipo randomLetters={false} strokeColor="white" letterChoices={LETTER_CHOICES} />
                    </span>
                </div>
            </div>

            {/* Veu + grain por cima do igaratipo. No Hero original o igaratipo fica
                ATRAS do gradiente translucido (alpha ~0.7) e do grain, e e isso que da
                o tom lavado e granulado. Aqui o ceu e opaco, entao o veu e uma segunda
                copia do gradiente, restrita ao topo para nao lavar as colinas. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 opacity-50 dark:hidden"
                style={{ background: SKY_LIGHT, ...TOP_FADE }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 hidden opacity-50 dark:block"
                style={{ background: SKY_DARK, ...TOP_FADE }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10" style={GRAIN} />
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10" style={{ ...GRAIN, ...TOP_FADE, opacity: 0.6 }} />

            {/* 5 — cracha 3D (desktop), acima de tudo. Mesma caixa do Hero original:
                   enquadramento de 107vh com -mt-14, mas o canvas cobre a secao toda
                   (frameHeight) para o cracha nunca ser cortado ao ser arrastado.
                   O canvas fica sem pointer-events para nao bloquear o painel; os
                   eventos vem da secao (eventSource) e o raycast so dispara quando o
                   cursor esta de fato sobre o cracha. */}
            <div className="hidden md:block">
                <LanyardDisplay
                    position={[-3, 0, 20]}
                    fov={17}
                    eventSource={sectionRef}
                    frameHeight={lanyardFrame}
                    containerClassName="absolute inset-x-0 top-0 z-50 -mt-14 h-[calc(100%+56px)] w-full select-none pointer-events-none"
                />
            </div>

            <div className="relative z-30 flex flex-col items-center px-4 md:px-6 md:pt-[max(76vh,440px)]">
                <div className="relative z-20 md:hidden">
                    <StaticCardDisplay />
                </div>

                <div
                    className="flex w-full max-w-[960px] flex-col items-center rounded-t-3xl border border-b-0 border-black/10 bg-white/75 px-5 pb-44 pt-12 backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(23,23,23,0.85)] min-[810px]:px-9 md:min-h-[560px] md:pt-16"
                >
                    <h2 className={`text-center transition-opacity duration-500 ${greetingKey ? 'opacity-100' : 'opacity-0'} text-3xl sm:text-4xl font-normal leading-[40px] tracking-[-1.28px] text-neutral-900 dark:text-neutral-100`}>
                        {greetingKey ? t(greetingKey) : t('greeting')}
                    </h2>
                    <p className="type-base mt-3 max-w-[586px] text-center text-neutral-600 dark:text-neutral-400">
                        {t('intro')}
                    </p>

                    <div className="mt-10 w-full">
                        <FakeTimeline />
                    </div>
                </div>
            </div>

            {/* 7 — arvores em primeiro plano, por cima do painel */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-2.5vw] z-40">
                <Image src={hillsFront} alt="" sizes="100vw" className="h-auto w-full select-none" />
            </div>

            {/* 8 — emenda com a proxima secao */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-20 bg-gradient-to-t from-background to-transparent"
            />
        </section>
    );
}
