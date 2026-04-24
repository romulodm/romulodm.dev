// app/[locale]/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "next-themes";
import { routing } from '@/i18n/routing';
import "./globals.css";
import Providers from "../providers";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jetbrains" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "Portfolio & Blog",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Portfolio e Blog de desenvolvimento",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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

  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!} />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans`}>
        <NextTopLoader color="hsl(var(--primary))" height={3} showSpinner={false} crawl crawlSpeed={500} speed={500} easing="ease" />
        <NextIntlClientProvider locale={locale} messages={(await import(`../../messages/${locale}.json`)).default}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Providers session={session}>
              {children}
              <CookieBanner />
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}