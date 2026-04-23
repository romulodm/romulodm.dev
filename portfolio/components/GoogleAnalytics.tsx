// components/GoogleAnalytics.tsx
// Carrega o script do GA4 apenas após o usuário aceitar cookies.
// Lê o cookie "cookie-consent" que o seu CookieBanner já define.

'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

// ── Funções exportadas para rastrear eventos manualmente ──────────────────────

export function trackEvent(action: string, params?: Record<string, unknown>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', action, params);
}

export function trackPageView(url: string, title?: string) {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', 'page_view', { page_location: url, page_title: title });
}

// ── Componente principal ──────────────────────────────────────────────────────

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
    const [consented, setConsented] = useState(false);

    useEffect(() => {
        // Verifica se o cookie de consentimento já foi aceito
        function checkConsent() {
            const match = document.cookie.match(/(?:^|;\s*)cookie-consent=([^;]*)/);
            setConsented(match?.[1] === 'accepted');
        }

        checkConsent();

        // Escuta o evento disparado pelo CookieBanner quando o usuário aceita
        window.addEventListener('cookie-consent-accepted', checkConsent);
        return () => window.removeEventListener('cookie-consent-accepted', checkConsent);
    }, []);

    if (!measurementId || !consented) return null;

    return (
        <>
            <Script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${measurementId}', {
                        send_page_view: true,
                        anonymize_ip: true
                    });
                `}
            </Script>
        </>
    );
}