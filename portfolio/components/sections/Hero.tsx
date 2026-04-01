'use client'

import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";

const LanyardDisplay = dynamic(() => import("@/components/lanyard/LanyardDisplay"), {
    ssr: false,
    loading: () => null,
});

const StaticCardDisplay = dynamic(() => import("@/components/lanyard/StaticCardDisplay"), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    ),
});

export default function Hero() {
    return (
        <section className="relative h-[113vh] min-h-screen overflow-hidden">

            <div className="absolute inset-0">
                {/* Spline como background */}
                <span className="dark:hidden">
                    <iframe
                        src={'https://my.spline.design/animatedbackgroundgradientforweb-eNmu3GwlWtMWzIk1ENC16Pb5/'}
                        className="absolute h-[115vh] inset-0 w-full h-full"
                        style={{ border: 'none', pointerEvents: 'none' }}
                        loading="lazy"
                    />
                </span>

                <span className="hidden dark:inline">
                    <iframe
                        src={'https://my.spline.design/animatedbackgroundgradientforweb-QQDE8jgzmEYbMsrm64TEbR92/'}
                        className="absolute h-[115vh] inset-0 w-full h-full"
                        style={{ border: 'none', pointerEvents: 'none' }}
                        loading="lazy"
                    />
                </span>

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

            {/* Desktop text content */}
            <div className="hidden sm:block absolute inset-0 pointer-events-none">

                {/* ── LEFT: Headline estilo ABRAhub ── */}
                <div className="absolute left-5 lg:left-32 bottom-[20vh] max-w-sm">

                    {/* Big headline */}
                    <h1
                        className="text-[2.6rem] leading-[1.05] font-black uppercase tracking-tight"
                        style={{ fontFamily: 'inherit' }}
                    >
                        {/* First lines — adapts to light/dark */}
                        <span className="block text-black/85 dark:text-white/90">
                            O CÓDIGO
                        </span>
                        <span className="block text-black/85 dark:text-white/90">
                            NÃO É ESCRITO,
                        </span>
                        {/* Last line — accent color (coral/orange, matches the lanyard) */}
                        <span
                            className="block"
                            style={{ color: '#f97316' }}
                        >
                            É PENSADO.
                        </span>
                    </h1>
                </div>

                {/* ── RIGHT: Quote ── */}
                <div className="absolute right-5 lg:right-32 bottom-[20vh] max-w-[260px] text-left border-l border-black dark:border-white pl-4">
                    <p className="text-[0.95rem] leading-relaxed text-black dark:text-white font-medium">
                        Transformo problemas complexos em interfaces simples, elegantes e que as pessoas adoram usar.
                    </p>
                </div>

            </div>

            {/* "View more" label — bottom center */}
            <div className="absolute bottom-[17vh] left-0 right-0 flex justify-center pointer-events-none">
                <span className="flex items-center gap-1 text-sm text-black/80 dark:text-white/80 tracking-widest uppercase">
                    View more <ChevronDown />
                </span>
            </div>

            {/* Fade bottom */}
            <div className="absolute bottom-14 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 bg-background h-14" />

        </section>
    );
}