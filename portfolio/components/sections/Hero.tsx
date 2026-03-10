'use client'

import { motion } from "framer-motion";
import { ArrowRight, Github, Mail } from "lucide-react";
import dynamic from "next/dynamic";

// Carrega o canvas 3D só depois que o JS principal já rodou
const LanyardDisplay = dynamic(() => import("@/components/LanyardDisplay"), {
    ssr: false,
    loading: () => null, // sem spinner, sem nada — o espaço fica vazio
});

const metrics = [
    { value: "8+", label: "Production Systems" },
    { value: "500K+", label: "Users Impacted" },
    { value: "12+", label: "Articles Published" },
];

export default function Hero() {
    return (
        <section className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(hsl(0_0%_0%_/_0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_0%_/_0.06)_1px,transparent_1px)] bg-[size:64px_64px] opacity-90 dark:bg-[linear-gradient(hsl(var(--foreground)_/_0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)_/_0.06)_1px,transparent_1px)] dark:opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_72%_50%_/_0.05),transparent_60%)] pointer-events-none" />

            <LanyardDisplay
                position={[-3, 0, 20]}
                fov={17}
                containerClassName="
                    absolute inset-0 z-10 w-full h-full select-none
                    translate-x-64 lg:translate-x-72
                    pointer-events-none
                "
            />

            {/* Este bloco NÃO depende do Lanyard — aparece imediatamente */}
            <div className="relative z-20 pointer-events-none max-w-7xl mx-auto px-6 flex items-center min-h-screen pt-20 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-full lg:w-1/2"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-mono text-muted-foreground">Available for opportunities</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
                        Romulo de Moraes
                    </h1>

                    <p className="text-xl md:text-2xl font-medium text-muted-foreground mb-2 leading-relaxed">
                        Software Engineer focused on{" "}
                        <span className="text-foreground">scalable systems</span> and{" "}
                        <span className="text-foreground">distributed architecture</span>.
                    </p>

                    <p className="text-base text-muted-foreground mb-10 max-w-xl leading-relaxed">
                        Building resilient backend infrastructure and high-performance
                        applications that serve hundreds of thousands of users in production.
                    </p>

                    <div className="flex flex-wrap gap-3 mb-10 pointer-events-auto">
                        <a
                            href="#projects"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            View Projects <ArrowRight size={16} />
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border"
                        >
                            <Github size={16} /> GitHub
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border"
                        >
                            <Mail size={16} /> Contact
                        </a>
                    </div>

                    <div className="flex gap-12">
                        {metrics.map((m, i) => (
                            <motion.div
                                key={m.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                            >
                                <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">{m.value}</div>
                                <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div >
            </div >
        </section >
    );
};