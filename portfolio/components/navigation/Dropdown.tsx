import { Languages, LogOut, Menu, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { navItems } from "./Navbar";
import { ThemeMenuItems } from "./ThemeMenuItems";

interface DropdownProps {
    user: {
        username?: string | null;
        image?: string | null;
        email?: string | null;
    }
    onOpenLanguageModal: () => void;
}

export function Dropdown({ user, onOpenLanguageModal }: DropdownProps) {
    const t = useTranslations('navigation.modal');
    const tNav = useTranslations('navigation');

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button>
                        <div className="md:hidden p-2 text-foreground hover:bg-gray-200 dark:hover:bg-secondary hover:text-black dark:hover:text-foreground rounded">
                            <Menu className="h-5 w-5" />
                        </div>
                        <div className="hidden md:flex pl-4">
                            <Image
                                src={user.image ?? "/default.png"}
                                alt={user?.username ?? "User"}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" side="bottom" className="w-64 bg-card border-border md:mt-2">

                    {/* Header */}
                    <DropdownMenuLabel>
                        <div className="flex items-center gap-3">
                            <Image
                                src={user.image ?? "/default.png"}
                                alt={user?.username ?? "User"}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                            />
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