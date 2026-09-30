'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import {
    CONSENT_CHANGED_EVENT,
    CONSENT_COOKIE,
    googleConsentState,
    isAnalyticsOptedOut,
    readConsent,
    setAnalyticsOptOut,
} from '@/lib/consent';

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

// ── Manual tracking helpers

export function trackEvent(action: string, params?: Record<string, unknown>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', action, params);
}

export function trackPageView(url: string, title?: string) {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', 'page_view', { page_location: url, page_title: title });
}

/**
 * Handles the opt-out link from the privacy policy: ?ga-optout=1 turns GA off
 * for this browser, ?ga-optout=0 turns it back on. The parameter is removed
 * from the URL afterwards so it is not shared or recorded as a page path.
 */
function applyOptOutParam() {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('ga-optout');
    if (flag !== '1' && flag !== '0') return;
    setAnalyticsOptOut(flag === '1');
    params.delete('ga-optout');
    const query = params.toString();
    window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
}

// ── Main component
//
// GA4 loads for every visitor that has not opted out, with or without a banner
// choice. Page views on client-side navigation come from GA4 enhanced
// measurement ("page changes based on browser history events"), so no manual
// page_view is sent here — doing both would double-count.

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (!measurementId) return;

        applyOptOutParam();
        if (isAnalyticsOptedOut()) {
            (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = true;
            return;
        }
        setEnabled(true);

        const onConsentChange = () => {
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', googleConsentState(readConsent()));
            }
        };
        window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
        return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
    }, [measurementId]);

    if (!measurementId || !enabled) return null;

    // The consent default must be pushed before 'config', so it is read from the
    // cookie inside the inline script instead of from React state.
    return (
        <>
            <Script id="ga4-init" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    var signals = /(?:^|;\\s*)${CONSENT_COOKIE}=all(?:;|$)/.test(document.cookie) ? 'granted' : 'denied';
                    gtag('consent', 'default', {
                        analytics_storage: 'granted',
                        ad_storage: signals,
                        ad_user_data: signals,
                        ad_personalization: 'denied'
                    });
                    gtag('js', new Date());
                    gtag('config', '${measurementId}');
                `}
            </Script>
            <Script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="afterInteractive"
            />
        </>
    );
}
