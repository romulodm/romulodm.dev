'use client'

import { motion } from "framer-motion";
import { ArrowRight, Github, Mail } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
            {/* 
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(hsl(0_0%_0%_/_0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_0%_/_0.06)_1px,transparent_1px)] bg-[size:64px_64px] opacity-90 dark:bg-[linear-gradient(hsl(var(--foreground)_/_0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)_/_0.06)_1px,transparent_1px)] dark:opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_72%_50%_/_0.05),transparent_60%)] pointer-events-none" /> 
            */}

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

                {/* Grain por cima */}
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

            {/* Grain overlay */}
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

            {/* Conteúdo principal */}
            <div className="hidden md:block relative max-w-7xl mx-auto px-6 flex flex-col lg:flex-row lg:items-center min-h-screen pt-20 pb-16">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 max-w-xs text-left">
                    <div className="backdrop-blur-md bg-black/30 dark:bg-black/50 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white dark:text-white/90 mb-2">
                            Seu título aqui
                        </h2>
                        <p className="text-sm text-white/80 dark:text-white/70">
                            Sua descrição aqui com o texto alinhado à esquerda.
                        </p>
                    </div>
                </div>

                <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 max-w-xs text-right">
                    <div className="backdrop-blur-md bg-black/30 dark:bg-black/50 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white dark:text-white/90 mb-2">
                            Seu título aqui
                        </h2>
                        <p className="text-sm text-white/80 dark:text-white/70">
                            Sua descrição aqui com o texto alinhado à direita.
                        </p>
                    </div>
                </div>

                <div className="absolute right-1/2 bottom-5 translate-x-1/2 max-w-xs text-right">
                    <h2 className="text-base text-black/60 dark:text-white/40 mb-2">
                        View more
                    </h2>
                </div>
            </div >

            {/* Fade bottom */}
            < div className="absolute bottom-14 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 bg-background h-14" />

        </section >
    );
}