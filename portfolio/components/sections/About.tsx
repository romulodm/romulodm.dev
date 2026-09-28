'use client';

import Image from "next/image";

import pic_1 from "@/public/assets/formatura.png";
import pic_2 from "@/public/assets/work.png";
import pic_3 from "@/public/assets/curso.png";
import pic_4 from "@/public/assets/cristo.png";
import pic_5 from "@/public/assets/evento_3.png";
import { RefObject, useEffect, useRef, useState } from "react";
import { ArrowRight, Github, Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import DissolveText from "@/components/DissolveText";
import { ContactTrigger } from "@/components/modals/ContactTrigger";

const SECONDARY_BUTTON =
    "inline-flex z-20 items-center gap-2 rounded-lg border border-gray-300 bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/70 dark:hover:text-white";

type Stat = {
    value: string;
    /** Key under `home.about.stats` in the messages files. */
    labelKey: "years" | "users" | "projects" | "articles";
};

const stats: Stat[] = [
    { value: "4+", labelKey: "years" },
    { value: "40K", labelKey: "users" },
    { value: "10+", labelKey: "projects" },
    { value: "3", labelKey: "articles" },
];

const BUILD_INTERVAL_MS = 4000;

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
    const t = useTranslations("home.about");
    const [sectionRef, inView] = useInView(0.12);

    /*
     * Phrases cycled after the headline (`home.about.builds`). They wrap on
     * narrow screens; DissolveText reserves the height of the longest one.
     */
    const builds = t.raw("builds") as string[];
    const [buildIndex, setBuildIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(
            () => setBuildIndex((i) => (i + 1) % builds.length),
            BUILD_INTERVAL_MS,
        );
        return () => clearInterval(id);
    }, [builds.length]);

    const reveal = (delay: number): React.CSSProperties =>
        inView ? { animation: `floatUp 0.65s ease forwards ${delay}s` } : {};

    return (
        <section className="max-w-7xl mt-10 mx-auto px-6 md:pb-12">
            {/* Header */}
            <div className="mb-12">
                <div className="mb-8 opacity-0" style={reveal(0.05)}>
                    <span
                        className="inline-flex items-center gap-2 font-mono text-xs text-orange-400/80 tracking-[0.2em] uppercase"
                    >
                        <span className="text-white/30">~/</span>
                        <span>romulo.exe --about</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    </span>
                </div>
                <p className="text-sm font-semibold text-about-label mb-3">
                    {t("eyebrow")}
                </p>
                <h1 className="type-h1 text-foreground max-w-2xl">
                    {t("headline")}
                    <DissolveText
                        text={builds[buildIndex % builds.length]}
                        phrases={builds}
                        className="text-primary"
                    />
                </h1>
                <p className="type-body mt-3 text-muted-foreground max-w-2xl">
                    {t("lede")}
                </p>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Left */}
                <div>
                    <h2 className="type-h3 text-foreground mb-6">
                        {t("whyTitle")}
                    </h2>

                    <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        {t("whyProblems")}
                    </p>

                    <p className="text-base text-muted-foreground leading-relaxed">
                        {t("whyProjects")}
                    </p>

                    <div className="flex flex-wrap gap-4 items-center pt-2 mt-6">
                        <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                            <MapPin className="w-4 h-4 text-orange-400/70" />
                            {t("location")}
                        </span>
                        <span className="w-px h-3 bg-white/10" aria-hidden />
                        <span className="flex items-center gap-1.5 text-base text-emerald-400/80">
                            {t("available")}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-3 my-5">
                        <a
                            href="#projects"
                            className="group inline-flex z-20 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            {t("viewProjects")}
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                        </a>
                        <a
                            href="https://github.com/romulodm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={SECONDARY_BUTTON}
                        >
                            <Github size={16} /> {t("github")}
                        </a>
                        <ContactTrigger className={SECONDARY_BUTTON}>
                            <Mail size={16} /> {t("contact")}
                        </ContactTrigger>
                    </div>

                    {/* Stats */}
                    <div className="mt-12">
                        <h3 className="text-sm font-semibold text-about-label mb-8">
                            {t("statsTitle")}
                        </h3>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            {stats.map((stat: Stat) => (
                                <div key={stat.labelKey}>
                                    <p className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t(`stats.${stat.labelKey}`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-5 grid-rows-8 gap-3 md:-mt-24 h-[700px] lg:h-[820px]">
                    {/* pic_2 — top right */}
                    <div className="col-start-4 col-span-2 row-start-1 row-span-2 rounded-2xl overflow-hidden">
                        <Image
                            src={pic_2}
                            alt={t("photos.whiteboard")}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* pic_1 — middle left (tall) */}
                    <div className="col-start-1 col-span-3 row-start-2 row-span-3 rounded-2xl overflow-hidden">
                        <Image
                            src={pic_1}
                            alt={t("photos.collaboration")}
                            className="w-full h-full object-cover shadow-5xl shadow-black dark:shadow-black/40"
                        />
                    </div>

                    {/* pic_4 — middle right */}
                    <div className="col-start-4 col-span-2 row-start-3 row-span-3 rounded-2xl overflow-hidden">
                        <Image
                            src={pic_4}
                            alt={t("photos.member")}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* pic_3 — bottom left */}
                    <div className="col-start-1 col-span-3 row-start-5 row-span-2 rounded-2xl overflow-hidden">
                        <Image
                            src={pic_3}
                            alt={t("photos.coworking")}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* pic_5 (nova) — bottom right, logo abaixo de pic_4 */}
                    <div className="col-start-4 col-span-2 row-start-6 row-span-2 rounded-2xl overflow-hidden">
                        <Image
                            src={pic_5}
                            alt={t("photos.workspace")}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;