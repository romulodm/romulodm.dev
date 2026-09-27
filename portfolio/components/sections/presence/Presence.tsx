'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import Cards from './Cards';
import { Eyebrow, cellClass } from './Cell';

/**
 * The "Agora" strip at the end of the section.
 *
 * Eight cells in one grid: three links written by hand, then the live cells
 * from <Cards /> (status, Spotify, commits, visitors). Copy comes from
 * the translations (`home.built.cards`), while the destination and the accent
 * colour stay here: an href is not translatable content, and keeping the list
 * in the JSON would let one locale point at a page the other does not have.
 *
 * The accents reuse the site's section tokens — the green of Vision, the brand
 * orange, the blue of the résumé — so the strip does not introduce a palette of
 * its own.
 *
 * Neutrals follow the page theme: text and muted copy use the shadcn tokens,
 * and the dividers use the same pair of greys as the home page `<hr>`s
 * (#e5e7eb light, #2f3031 dark), so the rule above the strip and the bars
 * between cells read as one line.
 */

type CardLink = {
    accent: string;
    href: string;
    external?: boolean;
};

const LINKS: CardLink[] = [
    { accent: 'var(--vision-color)', href: '/resume' },
    {
        accent: 'var(--primary-color)',
        href: 'https://www.npmjs.com/package/seedicon',
        external: true,
    },
    { accent: 'var(--resume-color)', href: '/blog' },
];

type CardText = {
    label: string;
    title: string;
    subtitle: string;
};

export default function BuiltLinks() {
    const t = useTranslations('home.built');

    // `t.raw` porque `t()` formata mensagem e devolve string — nao array.
    const cards = t.raw('cards') as CardText[];

    return (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {LINKS.map((link, index) => {
                const card = cards[index];
                if (!card) return null;

                const body = (
                    <>
                        <span className="flex items-center gap-2.5">
                            <Eyebrow accent={link.accent} label={card.label} />
                            <ArrowRight
                                aria-hidden="true"
                                className="ml-auto h-4 w-4 text-foreground opacity-40 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                            />
                        </span>

                        <span className="block">
                            <span className="block text-base font-semibold text-foreground">
                                {card.title}
                            </span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                                {card.subtitle}
                            </span>
                        </span>
                    </>
                );

                const className = `group ${cellClass(index)}`;

                return link.external ? (
                    <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={className}
                    >
                        {body}
                    </a>
                ) : (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={className}
                    >
                        {body}
                    </Link>
                );
            })}

            {/*
             * Cells 4 to 8: the manual status and the live values. They are
             * rendered by a client component because they come from an API
             * call, but they are direct children of this same grid, so the
             * dividers line up across both rows. `startIndex` is what lets
             * `cellClass` know which column each one lands in.
             *
             * The old "fale comigo" cell moved out of the strip: with the live
             * row in place it was the only cell that was not a fact about the
             * work, and the contact form already closes the page.
             */}
            <Cards startIndex={LINKS.length} />
        </div>
    );
}
