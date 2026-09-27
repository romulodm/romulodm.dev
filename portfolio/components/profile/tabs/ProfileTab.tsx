"use client";

import { Github, Linkedin, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Profile } from "../types";

export function ProfileTab({ profile }: { profile: Profile }) {
    const t = useTranslations("profilePage");

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border p-5 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("stats.title")}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-md bg-secondary/50">
                        <p className="text-2xl font-bold">{profile._count.comments}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("stats.comments")}</p>
                    </div>
                </div>
            </div>

            {(profile.githubUrl || profile.linkedinUrl) && (
                <div className="rounded-lg border border-border p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Links
                    </h2>
                    <div className="flex flex-col gap-2">
                        {profile.githubUrl && (
                            <a
                                href={profile.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                            >
                                <Github className="w-4 h-4 shrink-0" />
                                <span className="truncate">
                                    {profile.githubUrl.replace("https://github.com/", "")}
                                </span>
                                <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                            </a>
                        )}
                        {profile.linkedinUrl && (
                            <a
                                href={profile.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                            >
                                <Linkedin className="w-4 h-4 shrink-0" />
                                <span className="truncate">
                                    {profile.linkedinUrl
                                        .replace("https://linkedin.com/in/", "")
                                        .replace("https://www.linkedin.com/in/", "")}
                                </span>
                                <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}