"use client";

import { useState, useTransition } from "react";
import { Check, Github, Linkedin, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateProfileSettings } from "@/app/[locale]/profile/[username]/actions";
import type { Profile } from "../types";

export function SettingsTab({ profile }: { profile: Profile }) {
    const t = useTranslations("profilePage.settings");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { update: refreshSession } = useSession();

    // Profile fields
    const [username, setUsername] = useState(profile.username);
    const [githubUrl, setGithubUrl] = useState(profile.githubUrl ?? "");
    const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl ?? "");
    const [profileStatus, setProfileStatus] = useState<
        "idle" | "saving" | "ok" | "error" | "username_taken"
    >("idle");

    // Password fields
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwStatus, setPwStatus] = useState<
        "idle" | "saving" | "ok" | "error" | "mismatch"
    >("idle");

    const canSave =
        username.trim().length > 0 &&
        (username !== profile.username ||
            (githubUrl || null) !== profile.githubUrl ||
            (linkedinUrl || null) !== profile.linkedinUrl);

    function handleSaveProfile() {
        startTransition(async () => {
            setProfileStatus("saving");
            try {
                const result = await updateProfileSettings({
                    username: username !== profile.username ? username : undefined,
                    githubUrl: githubUrl || null,
                    linkedinUrl: linkedinUrl || null,
                });
                // Checar so `"error" in result` (e nao o valor junto) para o TS
                // estreitar o union e liberar `result.username` abaixo.
                if ("error" in result) {
                    setProfileStatus(
                        result.error === "username_taken" ? "username_taken" : "error",
                    );
                    return;
                }

                setProfileStatus("ok");
                setTimeout(() => setProfileStatus("idle"), 2500);

                if (result.username !== profile.username) {
                    // O token do NextAuth carrega o username do login: sem o
                    // update() o dropdown do navbar continua apontando para
                    // /profile/<antigo>. E a URL atual ainda e a antiga, que
                    // vira 404 assim que o cache do perfil e invalidado.
                    await refreshSession();
                    router.replace(`/profile/${result.username}`);
                } else {
                    router.refresh();
                }
            } catch {
                setProfileStatus("error");
            }
        });
    }

    function handleChangePassword() {
        if (newPw !== confirmPw) { setPwStatus("mismatch"); return; }
        startTransition(async () => {
            setPwStatus("saving");
            try {
                const res = await fetch("/api/profile/password", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
                });
                if (!res.ok) throw new Error();
                setPwStatus("ok");
                setCurrentPw(""); setNewPw(""); setConfirmPw("");
                setTimeout(() => setPwStatus("idle"), 2500);
            } catch {
                setPwStatus("error");
            }
        });
    }

    return (
        <div className="space-y-6">
            {/* ── Profile info ─────────────────────────────────────────────── */}
            <div className="rounded-lg border border-border p-5 space-y-4">
                <h3 className="type-small font-semibold text-foreground">{t("profile.title")}</h3>

                <Field label={t("profile.username")}>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                        maxLength={32}
                    />
                    {profileStatus === "username_taken" && (
                        <p className="text-xs text-red-500 mt-1">{t("profile.usernameTaken")}</p>
                    )}
                </Field>

                <Field label={t("profile.github")} icon={<Github className="w-3.5 h-3.5" />}>
                    <input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder={t("profile.githubPlaceholder")}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                </Field>

                <Field label={t("profile.linkedin")} icon={<Linkedin className="w-3.5 h-3.5" />}>
                    <input
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder={t("profile.linkedinPlaceholder")}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                </Field>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveProfile}
                        disabled={!canSave || isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isPending && profileStatus === "saving" && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        {t("save")}
                    </button>
                    {profileStatus === "ok" && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> {t("saved")}
                        </span>
                    )}
                    {profileStatus === "error" && (
                        <span className="text-xs text-red-500">{t("saveError")}</span>
                    )}
                </div>
            </div>

            {/* ── Password (email accounts only) ───────────────────────────── */}
            {profile.provider === "EMAIL_PASSWORD" && (
                <div className="rounded-lg border border-border p-5 space-y-4">
                    <h3 className="type-small font-semibold text-foreground">{t("password.title")}</h3>

                    <Field label={t("password.current")}>
                        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </Field>
                    <Field label={t("password.new")}>
                        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </Field>
                    <Field label={t("password.confirm")}>
                        <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </Field>

                    {pwStatus === "mismatch" && (
                        <p className="text-xs text-red-500">{t("password.mismatch")}</p>
                    )}
                    {pwStatus === "error" && (
                        <p className="text-xs text-red-500">{t("password.error")}</p>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleChangePassword}
                            disabled={!currentPw || !newPw || !confirmPw || isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isPending && pwStatus === "saving" && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            )}
                            {t("password.submit")}
                        </button>
                        {pwStatus === "ok" && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> {t("password.changed")}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Small helper ──────────────────────────────────────────────────────────────

function Field({
    label,
    icon,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {icon}
                {label}
            </label>
            {children}
        </div>
    );
}