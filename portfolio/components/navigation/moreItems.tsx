import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Coffee, FileText, MessageSquare, Radio } from "lucide-react";

/**
 * Itens do menu "More", em um modulo proprio porque agora tem dois consumidores:
 * o painel do desktop (NavMore) e os menus de hamburguer, onde "More" nao existe
 * e os links precisam aparecer junto com Home/Blog.
 */

/**
 * Link copy lives in messages/*.json under `navigation.links.<key>` (a label
 * and, for the "More" panel, a description). This module only holds what does
 * not depend on the locale.
 */
export type NavLinkKey =
    | "home"
    | "blog"
    | "guestbook"
    | "support"
    | "resume"
    | "newsletter"
    | "status";

export type FeaturedItem = {
    href: string;
    key: NavLinkKey;
    icon: LucideIcon;
    /** Cor do card: borda a 25% e fundo a 10% (visivel so enquanto a imagem carrega). */
    accent: string;
    /** Pixel art de fundo do card (public/images/more, 480x640 WebP, 3:4). */
    image: string;
};

export const featuredItems: FeaturedItem[] = [
    {
        href: "/wall",
        key: "guestbook",
        icon: MessageSquare,
        accent: "#b298f0",
        image: "/images/more/guestbook.webp",
    },
    {
        href: "/support",
        key: "support",
        icon: Coffee,
        accent: "#93d65f",
        image: "/images/more/apoiase.webp",
    },
];

export const quickLinks: {
    href: string;
    key: NavLinkKey;
    icon: ReactNode;
    external: boolean;
}[] = [
    {
        href: "/resume",
        key: "resume",
        icon: <FileText className="h-4 w-4" />,
        external: false,
    },
    {
        href: "/newsletter",
        key: "newsletter",
        icon: <Radio className="h-4 w-4" />,
        external: false,
    },
    {
        href: "/status",
        key: "status",
        icon: <Activity className="h-4 w-4" />,
        external: false,
    },
];

/**
 * Versao achatada para os menus de dropdown: os cards em destaque viram linhas
 * comuns, com icone em h-4 para bater com o resto da lista.
 */
export const moreItems: {
    href: string;
    key: NavLinkKey;
    icon: ReactNode;
    external: boolean;
}[] = [
    { href: "/wall", key: "guestbook", icon: <MessageSquare className="h-4 w-4" />, external: false },
    { href: "/support", key: "support", icon: <Coffee className="h-4 w-4" />, external: false },
    ...quickLinks,
];
