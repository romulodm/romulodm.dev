// app/[locale]/layout.tsx
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lobster } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "next-themes";
import { routing } from '@/i18n/routing';
import "./globals.css";
import Providers from "../providers";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ToastProvider } from "@/components/ToastProvider";
import {
  AUTHOR_NAME,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jetbrains" });
// Usada apenas no modo claro da secao ConnectShowcase ("bold side"), como no exemplo.
const lobster = Lobster({ subsets: ["latin"], weight: ["400"], variable: "--font-lobster", display: "swap" });

export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = {
  // `template` faz cada pagina virar "Blog | romulodm.dev" sem repetir o sufixo
  // em todo generateMetadata.
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  // Fallback de Open Graph: paginas que nao chamam buildPageMetadata ainda
  // saem com preview em vez de link cru.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Descoberta automatica do feed: leitores de RSS e a extensao do
            navegador procuram exatamente por esta tag. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} — RSS`}
          href={`/${locale}/feed.xml`}
        />
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!} />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} ${lobster.variable} font-sans`}>
        <NextTopLoader color="hsl(var(--primary))" height={3} showSpinner={false} crawl crawlSpeed={500} speed={500} easing="ease" />
        <NextIntlClientProvider locale={locale} messages={(await import(`../../messages/${locale}.json`)).default}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Providers>
              {children}
              <CookieBanner />
              <ToastProvider />
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}