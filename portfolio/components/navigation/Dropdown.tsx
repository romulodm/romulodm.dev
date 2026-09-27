import { Languages, LogOut, Menu, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { avatarUserFromSession, type AvatarUser } from "@/lib/avatar";
import { navItems } from "./Navbar";
import { moreItems } from "./moreItems";
import { ThemeMenuItems } from "./ThemeMenuItems";

interface DropdownProps {
    /**
     * Vem de `useSession().data.user`, nao de um select do Prisma — por isso
     * todo campo e opcional. Os tres de avatar sao injetados no JWT pelo
     * callback `session` em lib/auth.ts.
     */
    user: {
        username?: string | null;
        image?: string | null;
        email?: string | null;
        avatarSeed?: string | null;
        avatarStyle?: string | null;
        avatarSource?: string | null;
    }
    onOpenLanguageModal: () => void;
}

export function Dropdown({ user, onOpenLanguageModal }: DropdownProps) {
    const t = useTranslations('navigation.modal');
    const tNav = useTranslations('navigation');

    const avatarUser = avatarUserFromSession(user);

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button>
                        <div className="md:hidden p-2 text-foreground hover:bg-gray-200 dark:hover:bg-secondary hover:text-black dark:hover:text-foreground rounded">
                            <Menu className="h-5 w-5" />
                        </div>
                        <div className="hidden md:flex pl-4">
                            <AvatarSlot user={avatarUser} username={user.username} size={24} />
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" side="bottom" className="w-64 bg-card border-border md:mt-2">

                    {/* Header */}
                    <DropdownMenuLabel>
                        <div className="flex items-center gap-3">
                            <AvatarSlot user={avatarUser} username={user.username} size={32} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">@{user.username}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="flex items-center hover:cursor-pointer" asChild>
                        <Link href={`/profile/${user.username}`}>
                            <User className="mr-2 h-4 w-4" />
                            {t("profile")}
                        </Link>
                    </DropdownMenuItem>

                    <div className="md:hidden">
                        <DropdownMenuSeparator />
                        {navItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link href={item.href} className="flex items-center gap-2 text-sm">
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}

                        {/* Os links do "More" — o painel do desktop nao aparece no mobile
                            (hidden md:block em NavMore), entao eles entram achatados aqui. */}
                        {moreItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link
                                    href={item.href}
                                    target={item.external ? "_blank" : undefined}
                                    rel={item.external ? "noopener noreferrer" : undefined}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        <ThemeMenuItems />

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={onOpenLanguageModal} className="flex items-center gap-2 cursor-pointer">
                            <Languages className="h-4 w-4" />
                            {tNav("language")}
                        </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-border" />

                    <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: window.location.href })}
                        className="text-destructive cursor-pointer"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("logout")}
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

/**
 * O avatar da navbar, com uma saida para o caso de o JWT ainda nao carregar os
 * campos (token emitido antes desta feature). Nesse intervalo mostra a inicial
 * em vez de um PNG cinza generico — o callback `jwt` conserta o token na
 * primeira leitura de sessao, entao isto e transitorio.
 */
function AvatarSlot({
    user,
    username,
    size,
}: {
    user: AvatarUser | null;
    username?: string | null;
    size: number;
}) {
    if (user) return <UserAvatar user={user} size={size} />;

    return (
        <span
            className="flex shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold uppercase text-primary"
            style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
            {username?.charAt(0) ?? "?"}
        </span>
    );
}
