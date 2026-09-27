'use client';

import { useTranslations } from "next-intl";

import { NewsletterSubscribeForm } from "@/components/newsletter/NewsletterSubscribeForm";

export function FooterNewsletter() {
    const t = useTranslations("footer.newsletter");

    return (
        <div className="border-b border-white/10 mb-5">
            <div className="pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="type-h2 text-white mb-1">
                            {t("title")}
                        </h3>
                        <p className="text-white/50 text-sm sm:text-base">
                            {t("subtitle")}
                        </p>
                    </div>

                    <NewsletterSubscribeForm tone="dark" />
                </div>
            </div>
        </div>
    );
}
