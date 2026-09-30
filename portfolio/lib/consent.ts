// lib/consent.ts
//
// Cookie choice shared by CookieBanner and GoogleAnalytics.
//
// GA4 measurement (the _ga cookies) runs for every visitor, under legitimate
// interest (LGPD art. 7, IX), as described in section 7 of the privacy policy.
// The banner only decides the optional part: Google signals (aggregated
// demographics / cross-device), which needs ad_storage and ad_user_data.
// Visitors can object to the measurement itself through the opt-out link in
// the policy (?ga-optout=1), which is the "right to object" that legitimate
// interest requires.
//
// The accepted values changed in Sept/2026 ('accepted' | 'declined' became
// 'all' | 'essential'). Legacy values read as "no choice", so the banner shows
// again with the new wording. That is intentional: the policy promises a
// prominent notice when the legal basis of a processing changes.

export const CONSENT_COOKIE = 'cookie_consent';
export const OPTOUT_COOKIE = 'ga_optout';
export const CONSENT_CHANGED_EVENT = 'cookie-consent-changed';

const ONE_YEAR = 60 * 60 * 24 * 365;

export type ConsentChoice = 'all' | 'essential';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Deletes a cookie on the current host and on every parent domain. GA sets its
 * cookies on the registrable domain (.romulodm.dev), and a cookie only goes
 * away when the delete names the same domain it was set on.
 */
function deleteCookie(name: string) {
  const parts = window.location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join('.')}`);
  for (const domain of domains) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domain}`;
  }
}

function deleteCookiesByPrefix(prefixes: string[]) {
  document.cookie.split(';').forEach((raw) => {
    const name = raw.split('=')[0].trim();
    if (name && prefixes.some((p) => name.startsWith(p))) deleteCookie(name);
  });
}

export function readConsent(): ConsentChoice | null {
  const value = readCookie(CONSENT_COOKIE);
  return value === 'all' || value === 'essential' ? value : null;
}

export function writeConsent(choice: ConsentChoice) {
  writeCookie(CONSENT_COOKIE, choice, ONE_YEAR);
  // Google Ads conversion-linker cookies only exist with ad_storage granted.
  if (choice === 'essential') deleteCookiesByPrefix(['_gcl_']);
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_CHANGED_EVENT, { detail: choice }));
}

export function isAnalyticsOptedOut(): boolean {
  return readCookie(OPTOUT_COOKIE) === '1';
}

export function setAnalyticsOptOut(optOut: boolean) {
  if (optOut) {
    writeCookie(OPTOUT_COOKIE, '1', ONE_YEAR * 2);
    deleteCookiesByPrefix(['_ga', '_gid', '_gcl_']);
  } else {
    deleteCookie(OPTOUT_COOKIE);
  }
}

/** Consent Mode v2 state for a given banner choice. Ads personalization is never used. */
export function googleConsentState(choice: ConsentChoice | null) {
  const signals = choice === 'all' ? 'granted' : 'denied';
  return {
    analytics_storage: 'granted',
    ad_storage: signals,
    ad_user_data: signals,
    ad_personalization: 'denied',
  } as const;
}
