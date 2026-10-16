import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'pt', 'es'],
    localePrefix: "always",
    defaultLocale: 'pt',
});