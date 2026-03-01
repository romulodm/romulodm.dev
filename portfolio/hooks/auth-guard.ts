"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { toast } from "sonner";

/**
 * Returns a guard function. Wrap any action that requires auth.
 * If not logged in: opens the auth modal and shows a toast.
 * If logged in: calls the action.
 */
export function useAuthGuard() {
    const { data: session } = useSession();
    const { openModal } = useAuthModal();

    const guard = useCallback(
        (action: () => void) => {
            if (!session?.user) {
                toast("Entre ou crie sua conta para comentar", {
                    description: "Você precisa estar logado para interagir.",
                    action: {
                        label: "Entrar",
                        onClick: () => openModal("login"),
                    },
                });
                openModal("login");
                return;
            }
            action();
        },
        [session, openModal]
    );

    return { guard, isAuthenticated: !!session?.user };
}