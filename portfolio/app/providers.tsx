// app/providers.tsx
"use client";
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
            <ParallaxProvider>
                {children}
            </ParallaxProvider>
        </SessionProvider>
    );
};