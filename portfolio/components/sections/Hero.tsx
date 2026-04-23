'use client'

import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";


const LanyardDisplay = dynamic(() => import("@/components/lanyard/LanyardDisplay"), {
    ssr: false,
    loading: () => null,
});

// Skeleton placeholder for mobile card that matches final dimensions
const StaticCardSkeleton = () => (
    <div className="flex justify-center py-4">
        <div style={{ width: 260, height: 340 }} className="flex items-center justify-center">
            <div className="w-[180px] h-[240px] rounded-xl bg-black/20 dark:bg-white/10 animate-pulse" />
        </div>
    </div>
);

const StaticCardDisplay = dynamic(() => import("@/components/lanyard/StaticCardDisplay"), {
    ssr: false,
    loading: () => <StaticCardSkeleton />,
});

/**
 * HeroIgaratipo é importado diretamente (sem dynamic) porque:
 * - É um SVG animado puro, sem APIs exclusivas de browser no módulo raiz
 * - Renderiza no servidor como SVG vazio e hidrata no cliente sem layout shift
 *
 * Se ainda ocorrer erro de hidratação, troque pelo dynamic abaixo:
 *
 * const HeroIgaratipo = dynamic(() => import("@/components/HeroIgaratipo"), {
 *     ssr: false,
 *     loading: () => <div style={{ width: "100%", aspectRatio: "1400/320" }} />,
 * });
 */
import HeroIgaratipo from '@/components/HeroIgaratipo';

export default function Hero() {

    const darkGradient =
        `radial-gradient(
          circle at 50% 100%,
          rgba(255, 100, 50, 1) 0%,
          rgba(255, 150, 100, 0.8) 20%,
          rgba(100, 120, 200, 0.7) 40%,
          rgba(0, 0, 0, 1) 90%,
          rgba(20, 20, 30, 1) 100%
        )`

    const lightGradient =
        `radial-gradient(
          circle at 50% 100%,
          rgba(255, 100, 50, 1) 0%,
          rgba(255, 150, 100, 0.8) 20%,
          rgba(100, 120, 200, 0.7) 40%,
          rgba(255, 255, 255, 1) 90%,
          rgba(255, 255, 255, 1) 100%
        )`


    return (
        <section className="relative h-[107vh] min-h-screen overflow-hidden">
            <div
                className="dark:hidden absolute inset-0 transition-colors duration-500"
                style={{ background: lightGradient }}
            />

            <div
                className="hidden dark:inline absolute inset-0 transition-colors duration-500"
                style={{ background: darkGradient }}
            />

            <div className="absolute inset-0">
                {/* Grain overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'url("/grain.png")',
                        backgroundSize: '100px 100px',
                        backgroundRepeat: 'repeat',
                        mixBlendMode: 'overlay',
                        opacity: 0.6,
                    }}
                />
            </div>

            {/*
             * Igaratipo: reserva o espaço com aspect-ratio idêntico ao viewBox (1400x320).
             * O SVG server-renderiza vazio (paths sem "d") e anima ao hidratar.
             * Não há loading visível nem layout shift.
             */}
            <div
                className="top-[10vh] mx-auto mt-[15vh] w-full max-w-4xl pointer-events-none z-10"
                style={{ aspectRatio: "1400 / 320" }}
            >
                <span className="dark:hidden">
                    <HeroIgaratipo
                        randomLetters={false}
                        strokeColor="black"
                        letterChoices={[2, 0, 1, 0, 1, 0, undefined, 2]}
                    />
                </span>

                <span className="hidden dark:inline">
                    <HeroIgaratipo
                        randomLetters={false}
                        strokeColor="white"
                        letterChoices={[2, 0, 1, 0, 1, 0, undefined, 2]}
                    />
                </span>
            </div>

            {/* Grain overlay (second layer) */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'url("/grain.png")',
                    backgroundSize: "100px 100px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "overlay",
                    backgroundPosition: "left top",
                    mixBlendMode: "overlay",
                }}
            />

            {/* Lanyard 3D — desktop only */}
            <div className="hidden md:block">
                <LanyardDisplay
                    position={[-3, 0, 20]}
                    fov={17}
                    containerClassName="
                        absolute inset-0 z-20 w-full h-full select-none
                        pointer-events-none -mt-14
                    "
                />
            </div>

            <div className="block md:hidden mt-7">
                <StaticCardDisplay />
            </div>

            {/* "View more" label — bottom center */}
            <div className="absolute bottom-[11vh] left-0 right-0 flex justify-center pointer-events-none">
                <span className="flex flex-col items-center text-xs text-black dark:text-white tracking-widest uppercase">
                    View more <ChevronDown />
                </span>
            </div>

            {/* Fade bottom */}
            <div className="absolute bottom-14 left-0 right-0 h-[15vh] bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 bg-background h-14" />
        </section>
    );
}
