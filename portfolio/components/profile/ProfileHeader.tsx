"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import BanButton from "@/components/BanButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AvatarSourceValue, AvatarUser } from "@/lib/avatar";
import { AvatarModal } from "./AvatarModal";
import type { Profile } from "./types";

interface Props {
    profile: Profile;
    isMe: boolean;
    isAdmin: boolean;
    locale: string;
    localeCode: string;
}

export function ProfileHeader({ profile, isMe, isAdmin, localeCode }: Props) {
    const t = useTranslations("profilePage");

    const [modalOpen, setModalOpen] = useState(false);

    // O avatar salvo vive em estado local para trocar na hora depois do save:
    // `getProfileByUsername` e um unstable_cache com revalidate de 60s, entao
    // esperar o servidor deixaria a imagem velha na tela por ate um minuto.
    const [avatar, setAvatar] = useState({
        avatarSeed: profile.avatarSeed,
        avatarStyle: profile.avatarStyle,
        avatarSource: profile.avatarSource as AvatarSourceValue,
    });

    const avatarUser: AvatarUser = {
        username: profile.username,
        image: profile.image,
        ...avatar,
    };

    const joinedDate = new Intl.DateTimeFormat(localeCode, {
        year: "numeric",
        month: "long",
    }).format(new Date(profile.createdAt));

    return (
        <div className="flex items-start gap-5 mb-8">
            <div className="relative shrink-0 group">
                <UserAvatar
                    user={avatarUser}
                    size={80}
                    priority
                    className="ring-2 ring-border"
                />

                {isMe && (
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        aria-label="Editar imagem do perfil"
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isMe && (
                <AvatarModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    user={avatarUser}
                    onSaved={(next) =>
                        setAvatar({
                            avatarSeed: next.seed,
                            avatarStyle: next.style,
                            avatarSource: next.source,
                        })
                    }
                />
            )}

            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">@{profile.username}</h1>
                {isMe && (
                    <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                    {t("memberSince", { date: joinedDate })}
                </p>
            </div>

            {isMe && (
                <button
                    onClick={() => signOut({ callbackUrl: window.location.href })}
                    className="shrink-0 px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
                >
                    {t("signOut")}
                </button>
            )}

            {isAdmin && !isMe && (
                <BanButton userId={profile.id} initialBanned={profile.banned ?? false} />
            )}
        </div>
    );
}
