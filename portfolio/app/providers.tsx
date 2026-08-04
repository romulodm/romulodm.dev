// app/providers.tsx
"use client";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import SentryUserContext from "@/components/observability/SentryUserContext";
import { SessionProvider, type SessionProviderProps } from "next-auth/react";
import type { ReactNode } from "react";
import { ParallaxProvider } from "react-scroll-parallax";

export default function Providers({
    children,
    session
}: {
    children: ReactNode;
    session: SessionProviderProps['session'];
}) {
    return (
        <SessionProvider session={session}>
            <SentryUserContext />
            <AuthModalProvider>
                <ParallaxProvider>
                    {children}
                </ParallaxProvider>
            </AuthModalProvider>
        </SessionProvider>
    );
};