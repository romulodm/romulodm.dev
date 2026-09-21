'use client';

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { AnimatedSection } from "./AnimatedSection";
import { ContactTrigger } from "./modals/ContactTrigger";

/**
 * Secao de perguntas frequentes: cabecalho fixo a esquerda e lista numerada a
 * direita (empilha no mobile).
 *
 * As perguntas vivem em `messages/{locale}.json` sob `faq.items`, lidas com
 * `t.raw` — `t()` formata mensagem e nao devolve array. O cabecalho vem de
 * `home.faq` (eyebrow, title, description).
 *
 * Cada item pode ter um `cta` + `href` opcionais. Isso existe para nao precisar
 * de HTML dentro da traducao: link como dado, e nao como marcacao, evita
 * `dangerouslySetInnerHTML` e mantem o JSON legivel para quem so quer revisar
 * texto.
 */

interface FAQItemData {
    q: string;
    a: string;
    cta?: string;
    href?: string;
}

interface FAQItemProps {
    item: FAQItemData;
    number: string;
    isOpen: boolean;
    onToggle: () => void;
    /** Base para os ids de aria — precisa ser estavel entre servidor e cliente. */
    domId: string;
}

/**
 * Sinal de "+" que vira "−". Ao abrir, as duas barras giram em sentido
 * horario: a horizontal da meia volta (180°) e a vertical um quarto (90°),
 * terminando as duas deitadas uma sobre a outra. Ao fechar, a transicao
 * volta pelo mesmo caminho (anti-horario) e o "+" se reconstroi.
 */
function PlusMinus({ isOpen }: { isOpen: boolean }) {
    const bar =
        "absolute bg-current transition-transform duration-300 ease-out";

    return (
        <span aria-hidden className="relative h-4 w-4 justify-self-end">
            <span
                className={cn(
                    bar,
                    "left-0 top-[7px] h-0.5 w-4",
                    isOpen ? "rotate-180" : "rotate-0",
                )}
            />
            <span
                className={cn(
                    bar,
                    "left-[7px] top-0 h-4 w-0.5",
                    isOpen ? "rotate-90" : "rotate-0",
                )}
            />
        </span>
    );
}

function FAQItem({ item, number, isOpen, onToggle, domId }: FAQItemProps) {
    const buttonId = `${domId}-button`;
    const panelId = `${domId}-panel`;
    const isExternal = Boolean(item.href && /^https?:\/\//.test(item.href));
    const ctaClassName =
        "text-sm font-medium text-primary transition-opacity hover:opacity-80";

    return (
        <div className="flex flex-col border-b border-border">
            <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={onToggle}
                className={cn(
                    "grid w-full grid-cols-[32px_minmax(0,1fr)_24px] items-center gap-4 py-5 text-left sm:grid-cols-[40px_minmax(0,1fr)_24px] lg:py-[22px]",
                    "text-foreground transition-colors hover:text-primary",
                    "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                )}
            >
                <span className="text-xs font-medium tabular-nums tracking-[0.04em] text-muted-foreground">
                    {number}
                </span>
                <span className="text-lg font-semibold leading-snug tracking-tight lg:text-xl">
                    {item.q}
                </span>
                <PlusMinus isOpen={isOpen} />
            </button>

            <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                    "grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out",
                    isOpen
                        ? "visible grid-rows-[1fr] opacity-100"
                        : "invisible grid-rows-[0fr] opacity-0",
                )}
            >
                <div className="overflow-hidden">
                    <div className="pb-6 sm:pl-14 sm:pr-10 lg:pb-[26px]">
                        <p className="text-pretty text-base leading-[1.65] text-muted-foreground">
                            {item.a}
                        </p>

                        {item.cta && item.href && (
                            <p className="mt-3">
                                {isExternal ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={ctaClassName}
                                    >
                                        {item.cta} →
                                    </a>
                                ) : (
                                    <Link href={item.href} className={ctaClassName}>
                                        {item.cta} →
                                    </Link>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FAQ({ allowMultiple = false }: { allowMultiple?: boolean }) {
    const t = useTranslations("faq");
    const tHeader = useTranslations("home.faq");
    const domId = useId();

    const items = t.raw("items") as FAQItemData[];

    // O primeiro item comeca aberto: mostra de cara que a lista expande.
    const [open, setOpen] = useState<Set<number>>(() => new Set([0]));

    const toggle = (index: number) => {
        setOpen((previous) => {
            const next = new Set(previous);
            if (next.has(index)) {
                next.delete(index);
                return next;
            }
            if (!allowMultiple) next.clear();
            next.add(index);
            return next;
        });
    };

    if (!Array.isArray(items) || items.length === 0) return null;

    return (
        <AnimatedSection className="relative z-10 w-full" delay={0.2}>
            <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-20">
                <header className="flex flex-col gap-4 self-start lg:sticky lg:top-24">
                    <p
                        className="text-sm font-semibold uppercase tracking-widest"
                        style={{ color: "var(--primary-color)" }}
                    >
                        {tHeader("eyebrow")}
                    </p>
                    <h2 className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl lg:text-5xl lg:leading-[1.05]">
                        {tHeader("title")}
                    </h2>
                    <p className="max-w-[360px] text-pretty text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {tHeader("description")}{" "}
                        {tHeader.rich("contact", {
                            link: (chunks) => (
                                <ContactTrigger
                                    topic="OTHER"
                                    className="font-medium text-primary underline decoration-primary/40 underline-offset-[3px] transition-colors hover:decoration-current"
                                >
                                    {chunks}
                                </ContactTrigger>
                            ),
                        })}
                    </p>
                </header>

                <div className="flex flex-col border-t border-border lg:border-t-0">
                    {items.map((item, index) => (
                        <FAQItem
                            key={item.q}
                            item={item}
                            number={String(index + 1).padStart(2, "0")}
                            domId={`${domId}-${index}`}
                            isOpen={open.has(index)}
                            onToggle={() => toggle(index)}
                        />
                    ))}
                </div>
            </div>
        </AnimatedSection>
    );
}
