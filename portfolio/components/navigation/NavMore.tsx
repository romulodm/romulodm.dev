'use client'

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, FileText, Radio, Activity, Heart, BookOpen } from "lucide-react";

interface MoreMenuProps {
    onClose?: () => void;
}

const featuredItems = [
    {
        href: "/wall",
        title: "Guestbook",
        description: "Deixe uma mensagem aqui",
        icon: <BookOpen className="h-5 w-5" />,
        image: "/assets/wall.png",
        accent: "from-violet-500/20 to-purple-600/20",
    },
    {
        href: "/support",
        title: "Apoia-se",
        description: "Me apoie para continuar criando",
        icon: <Heart className="h-5 w-5" />,
        image: "/assets/coffee.png",
        accent: "from-rose-500/20 to-pink-600/20",
    },
];

const quickLinks = [
    {
        href: "/resume",
        label: "Resume",
        description: "Minha experiência profissional",
        icon: <FileText className="h-4 w-4" />,
        external: false
    },
    {
        href: "/newsletter",
        label: "Newsletter",
        description: "Assine para receber novidades",
        icon: <Radio className="h-4 w-4" />,
        external: false
    },
    {
        href: "/status",
        label: "Status",
        description: "Uptime dos meus serviços",
        icon: <Activity className="h-4 w-4" />,
        external: true,
    },
];

export function NavMore({ onClose }: MoreMenuProps) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 120);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger */}
            <button
                className={`flex items-center gap-1 text-sm transition-colors ${open
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                More
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown panel */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[540px] transition-all duration-200 origin-top ${open
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                    }`}
            >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-l border-t border-border" />

                <div className="relative bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden p-3 grid grid-cols-[1fr_220px] gap-3 items-stretch">
                    {/* Left: Featured cards */}
                    <div className="grid grid-cols-2 gap-2 self-stretch">
                        {featuredItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className="group relative rounded-lg overflow-hidden min-h-36 flex flex-col justify-end p-3 bg-muted hover:ring-1 hover:ring-primary/40 transition-all duration-200"
                            >
                                {/* Background image */}
                                {item.image && (
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="160px"
                                    />
                                )}

                                {/* Gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-60`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                {/* Icon top-right */}
                                <div className="absolute top-2.5 right-2.5 text-white/60 group-hover:text-white/90 transition-colors">
                                    {item.icon}
                                </div>

                                {/* Text */}
                                <div className="relative z-10">
                                    <p className="text-sm font-semibold text-white leading-tight">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-white/60 mt-0.5 leading-snug">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Right: Quick links */}
                    <div className="flex flex-col gap-1 justify-center">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                rel={link.external ? "noopener noreferrer" : undefined}
                                onClick={() => setOpen(false)}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors duration-150"
                            >
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                                    {link.icon}
                                </span>
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-foreground leading-none">
                                        {link.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                        {link.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}