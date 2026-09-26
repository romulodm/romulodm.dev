'use client'

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { featuredItems, quickLinks } from "./moreItems";

interface MoreMenuProps {
    onClose?: () => void;
}

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
        // Escondido no mobile: la os mesmos links entram achatados no menu de
        // hamburguer (ver moreItems), porque o painel (~600px) nao cabe.
        <div
            className="relative hidden md:block"
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
            {/* Largura pelo conteudo (w-max): os cards tem 148px fixos e a coluna
                da direita cresce com o texto mais longo, sem quebrar linha. */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-max transition-all duration-200 origin-top ${open
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                    }`}
            >
                {/* Arrow */}
                <div className="absolute -top-1.5 z-10 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-l border-t border-border" />

                <div className="relative bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden p-3 grid grid-cols-[auto_auto] gap-3 items-stretch">
                    {/* Left: Featured cards */}
                    <div className="grid grid-cols-2 gap-2 self-stretch">
                        {featuredItems.map(({ href, title, description, icon: Icon, accent, image }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setOpen(false)}
                                className="group relative flex h-full w-[148px] flex-col justify-between gap-6 overflow-hidden border-border rounded-xl border p-3.5 transition-colors"
                                style={{
                                    backgroundColor: `${accent}1a`,
                                }}
                            >
                                {/* Pixel art de fundo, decorativa: o titulo ja descreve o link. */}
                                <Image
                                    src={image}
                                    alt=""
                                    fill
                                    sizes="148px"
                                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                />

                                {/* Gradiente escuro embaixo, onde fica o texto: garante
                                    contraste do texto branco em qualquer tema, mesmo
                                    sobre as areas claras da pintura. */}
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/25"
                                />

                                {/* Icone solto em branco, alinhado a esquerda com o texto
                                    de baixo. A sombra segura o contraste nas areas claras
                                    da pintura (a janela do Guestbook, o ceu do Apoia-se). */}
                                <Icon
                                    size={20}
                                    strokeWidth={2}
                                    className="relative text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
                                />

                                <div className="relative">
                                    <p className="text-xs font-medium text-white">
                                        {title}
                                    </p>
                                    <p className="text-xs leading-snug text-white/75">
                                        {description}
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
                                <div className="flex flex-col whitespace-nowrap">
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
