// app/providers.tsx
"use client";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import SentryUserContext from "@/components/observability/SentryUserContext";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ParallaxProvider } from "react-scroll-parallax";

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <SentryUserContext />
            <AuthModalProvider>
                <ParallaxProvider>
                    {children}
                </ParallaxProvider>
            </AuthModalProvider>
        </SessionProvider>
    );
};