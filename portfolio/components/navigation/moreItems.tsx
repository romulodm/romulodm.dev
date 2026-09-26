import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Coffee, FileText, MessageSquare, Radio } from "lucide-react";

/**
 * Itens do menu "More", em um modulo proprio porque agora tem dois consumidores:
 * o painel do desktop (NavMore) e os menus de hamburguer, onde "More" nao existe
 * e os links precisam aparecer junto com Home/Blog.
 */

export type FeaturedItem = {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    /** Cor do card: borda a 25% e fundo a 10% (visivel so enquanto a imagem carrega). */
    accent: string;
    /** Pixel art de fundo do card (public/images/more, 480x640 WebP, 3:4). */
    image: string;
};

export const featuredItems: FeaturedItem[] = [
    {
        href: "/wall",
        title: "Guestbook",
        description: "Deixe uma mensagem aqui",
        icon: MessageSquare,
        accent: "#b298f0",
        image: "/images/more/guestbook.webp",
    },
    {
        href: "/support",
        title: "Apoia-se",
        description: "Me apoie para continuar criando",
        icon: Coffee,
        accent: "#93d65f",
        image: "/images/more/apoiase.webp",
    },
];

export const quickLinks = [
    {
        href: "/resume",
        label: "Resume",
        description: "Minha experiencia profissional",
        icon: <FileText className="h-4 w-4" />,
        external: false,
    },
    {
        href: "/newsletter",
        label: "Newsletter",
        description: "Assine para receber novidades",
        icon: <Radio className="h-4 w-4" />,
        external: false,
    },
    {
        href: "/status",
        label: "Status",
        description: "Uptime dos meus servicos",
        icon: <Activity className="h-4 w-4" />,
        external: true,
    },
];

/**
 * Versao achatada para os menus de dropdown: os cards em destaque viram linhas
 * comuns, com icone em h-4 para bater com o resto da lista.
 */
export const moreItems: {
    href: string;
    label: string;
    icon: ReactNode;
    external: boolean;
}[] = [
    { href: "/wall", label: "Guestbook", icon: <MessageSquare className="h-4 w-4" />, external: false },
    { href: "/support", label: "Apoia-se", icon: <Coffee className="h-4 w-4" />, external: false },
    ...quickLinks.map(({ href, label, icon, external }) => ({ href, label, icon, external })),
];
