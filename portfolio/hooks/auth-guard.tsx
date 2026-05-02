"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export function useAuthGuard() {
    const { data: session } = useSession();
    const { openModal } = useAuthModal();
    const t = useTranslations("authGuard");

    const guard = useCallback(
        (action: () => void) => {
            if (!session?.user) {
                toast.info(
                    <div>
                        <p style={{ fontWeight: 600, marginBottom: 4 }}>{t("title")}</p>
                        <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>{t("description")}</p>
                        <button
                            onClick={() => openModal("login")}
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "4px 12px",
                                borderRadius: 6,
                                border: "1px solid currentColor",
                                cursor: "pointer",
                                background: "transparent",
                            }}
                        >
                            {t("action")}
                        </button>
                    </div>,
                    { autoClose: 5000 }
                );
                openModal("login");
                return;
            }
            action();
        },
        [session, openModal, t]
    );

    return { guard, isAuthenticated: !!session?.user };
}