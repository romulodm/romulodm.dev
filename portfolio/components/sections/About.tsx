'use client';

import Image from "next/image";

import team1 from "@/public/assets/team-1.jpg";
import team2 from "@/public/assets/team-2.jpg";
import team3 from "@/public/assets/team-3.jpg";
import team4 from "@/public/assets/team-4.jpg";
import { RefObject, useEffect, useRef, useState } from "react";
import { ArrowRight, Github, Mail, MapPin } from "lucide-react";

type Stat = {
    value: string;
    label: string;
};

const stats: Stat[] = [
    { value: "4+", label: "Years coding" },
    { value: "40K", label: "Users impacted" },
    { value: "10+", label: "Projects shipped" },
    { value: "1", label: "Article published" },
];

function useInView(threshold = 0.15): [RefObject<HTMLElement | null>, boolean] {
    const ref = useRef<HTMLElement>(null);
    const [inView, setInView] = useState<boolean>(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setInView(true);
            },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, inView];
}

const About: React.FC = () => {
    const [sectionRef, inView] = useInView(0.12);

    const reveal = (delay: number): React.CSSProperties =>
        inView ? { animation: `floatUp 0.65s ease forwards ${delay}s` } : {};

    return (
        <section className="max-w-7xl -mt-5 mx-auto px-6 md:pb-12">
            {/* Header */}
            <div className="mb-12">
                <div className="mb-8 opacity-0" style={reveal(0.05)}>
                    <span
                        className="inline-flex items-center gap-2 text-xs text-orange-400/80 tracking-[0.2em] uppercase"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                        <span className="text-white/30">~/</span>
                        <span>romulo.exe --about</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    </span>
                </div>
                <p className="text-sm font-semibold text-about-label mb-3">
                    About us
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1] max-w-2xl">
                    On a mission to empower remote teams
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                    Aliquet nec orci mattis amet quisque ullamcorper neque, nibh sem. At
                    arcu, sit dui mi, nibh dui, diam eget aliquam. Quisque id at vitae
                    feugiat egestas.
                </p>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Left */}
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-6">
                        Our mission
                    </h2>

                    <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus
                        enim. Mattis mauris semper sed amet vitae sed turpis id. Id dolor
                        praesent donec est. Odio penatibus risus viverra tellus varius sit
                        neque erat velit.
                    </p>

                    <p className="text-base text-muted-foreground leading-relaxed">
                        Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio
                        id et. Id blandit molestie auctor fermentum dignissim.
                    </p>

                    <div className="flex flex-wrap gap-4 items-center pt-2 mt-6">
                        <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                            <MapPin className="w-4 h-4 text-orange-400/70" />
                            Rio Grande, RS - Brazil
                        </span>
                        <span className="w-px h-3 bg-white/10" aria-hidden />
                        <span className="flex items-center gap-1.5 text-base text-emerald-400/80">
                            Open to opportunities
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-3 my-5">
                        <a
                            href="#projects"
                            className="inline-flex z-20 items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            View Projects <ArrowRight size={16} />
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex z-20 items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border"
                        >
                            <Github size={16} /> GitHub
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex z-20 items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border"
                        >
                            <Mail size={16} /> Contact
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="mt-12">
                        <h3 className="text-sm font-semibold text-about-label mb-8">
                            The numbers
                        </h3>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            {stats.map((stat: Stat) => (
                                <div key={stat.label}>
                                    <p className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-5 grid-rows-8 gap-3 md:-mt-20 h-[700px] lg:h-[820px]">
                    {/* team2 — top right */}
                    <div className="col-start-4 col-span-2 row-start-1 row-span-2 rounded-2xl overflow-hidden">
                        <Image
                            src={team2}
                            alt="Team whiteboard session"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* team1 — middle left (tall) */}
                    <div className="col-start-1 col-span-3 row-start-2 row-span-3 rounded-2xl overflow-hidden">
                        <Image
                            src={team1}
                            alt="Team collaboration"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* team4 — middle right */}
                    <div className="col-start-4 col-span-2 row-start-3 row-span-3 rounded-2xl overflow-hidden">
                        <Image
                            src={team4}
                            alt="Team member"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* team3 — bottom left */}
                    <div className="col-start-1 col-span-3 row-start-5 row-span-2 rounded-2xl overflow-hidden">
                        <Image
                            src={team3}
                            alt="Coworking space"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* team1 (nova) — bottom right, logo abaixo de team4 */}
                    <div className="col-start-4 col-span-2 row-start-6 row-span-2 rounded-2xl overflow-hidden">
                        <Image
                            src={team1}
                            alt="Nova imagem"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;