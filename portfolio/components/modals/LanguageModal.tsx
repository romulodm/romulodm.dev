"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LocaleData {
    label: string;
    flag: string;
    name: string;
}

const locales: Record<Locale, LocaleData> = {
    pt: { label: "PT", flag: "/flags/pt.svg", name: "Português" },
    en: { label: "EN", flag: "/flags/en.svg", name: "English" },
};

interface LanguageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LanguageModal({ open, onOpenChange }: LanguageModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const locale = useLocale() as Locale;
    const t = useTranslations("language");

    const [isPending, startTransition] = useTransition();

    function handleLanguageChange(nextLocale: Locale) {
        startTransition(() => {
            router.replace(
                // @ts-expect-error - mesmo motivo do exemplo do next-intl
                { pathname, params },
                { locale: nextLocale }
            );
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("subtitle")}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {(Object.entries(locales) as [Locale, LocaleData][]).map(
                        ([code, data]) => (
                            <Button
                                key={code}
                                disabled={isPending}
                                variant={locale === code ? "default" : "outline"}
                                className={`flex items-center justify-start gap-3 h-14 border-border
                                    ${locale === code
                                        ? "text-white bg-primary/80 border-primary/20 dark:bg-primary/30 dark:border-transparent"
                                        : "hover:bg-primary/80 hover:border-primary/20 dark:hover:bg-primary/30 dark:hover:border-transparent"
                                    }`}
                                onClick={() => handleLanguageChange(code)}
                            >
                                <Image
                                    src={data.flag}
                                    alt={data.label}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 mt-0.5 rounded-full object-cover"
                                />
                                <span className="font-medium">{data.name}</span>
                            </Button>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}