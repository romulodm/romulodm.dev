'use client';

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { AnimatedSection } from "./AnimatedSection";

/**
 * Acordeao de perguntas frequentes.
 *
 * As perguntas vivem em `messages/{locale}.json` sob `faq.items`, lidas com
 * `t.raw` — `t()` formata mensagem e nao devolve array.
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
    isOpen: boolean;
    onToggle: () => void;
    /** Base para os ids de aria — precisa ser estavel entre servidor e cliente. */
    domId: string;
}
function FAQItem({ item, isOpen, onToggle, domId }: FAQItemProps) {
    const buttonId = `${domId}-button`;
    const panelId = `${domId}-panel`;
    const isExternal = Boolean(item.href && /^https?:\/\//.test(item.href));

    return (
        <div
            className={cn(
                "w-full overflow-hidden rounded-sm bg-neutral-200/90 backdrop-blur-sm dark:bg-neutral-900/80",
                "border border-border/50 transition-colors",
                "hover:border-border/80",
            )}
        >
            {/*
             * Botao de verdade, nao div com onClick: a versao anterior nao era
             * alcancavel por teclado e nao anunciava estado para leitor de tela.
             */}
            <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-5 px-5 py-[18px] pr-4 text-left"
            >
                <span className="flex-1 text-base font-medium leading-6 text-foreground">
                    {item.q}
                </span>
                <ChevronDown
                    aria-hidden
                    className={cn(
                        "h-6 w-6 shrink-0 text-muted-foreground transition-transform duration-500 ease-out",
                        isOpen ? "rotate-180" : "rotate-0",
                    )}
                />
            </button>

            {/*
             * Abertura por `grid-template-rows: 0fr -> 1fr`.
             *
             * A alternativa comum, `max-height: 0 -> valor grande`, tem um
             * defeito visivel ao fechar: o navegador interpola ate o teto
             * arbitrario (digamos 1000px), mas o conteudo tem ~150px. Os
             * primeiros ~85% da transicao acontecem fora da tela e o painel
             * parece travar antes de sumir de uma vez.
             *
             * Com `fr` o alvo e a altura real do conteudo, entao a duracao vale
             * inteira nos dois sentidos e nao ha numero magico para manter.
             * Exige o filho com `overflow-hidden` para recortar durante o
             * colapso.
             *
             * `invisible` tira o link interno da ordem de tabulacao com o painel
             * fechado — o atributo `hidden` faria isso tambem, mas aplica
             * `display: none` e cancelaria a transicao.
             */}
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
                    <hr className="mx-5 mb-2 border-border/50" />

                    <div className="px-5 pb-[18px] pt-2">
                        <p className="text-sm leading-6 text-muted-foreground">{item.a}</p>

                        {item.cta && item.href && (
                            <p className="mt-3">
                                {isExternal ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
                                    >
                                        {item.cta} →
                                    </a>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
                                    >
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

export function FAQ({ allowMultiple = true }: { allowMultiple?: boolean }) {
    const t = useTranslations("faq");
    const domId = useId();

    const items = t.raw("items") as FAQItemData[];

    const [open, setOpen] = useState<Set<number>>(new Set());

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
        <AnimatedSection className="relative z-10 mx-auto" delay={0.4}>
            {/*
             * O titulo da secao vive em <SectionHeader> na page — aqui fica so
             * o acordeao, para nao existirem dois <h2> concorrendo.
             */}
            <section className="w-full pt-12 md:pt-16">
                <div className="mx-auto flex max-w-[900px] flex-col gap-4">
                    {items.map((item, index) => (
                        <FAQItem
                            key={item.q}
                            item={item}
                            domId={`${domId}-${index}`}
                            isOpen={open.has(index)}
                            onToggle={() => toggle(index)}
                        />
                    ))}
                </div>
            </section>
        </AnimatedSection>
    );
}
