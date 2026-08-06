import type { ReactNode } from 'react';

export type SectionAccent =
    | 'resume'
    | 'projects'
    | 'vision'
    | 'software'
    | 'contact'
    /** espelha o `--primary` do tema — para secoes sem cor propria */
    | 'primary';

type SectionHeaderProps = {
    accent: SectionAccent;
    icon: ReactNode;
    eyebrow: string;
    title: string;
    description?: string;
    /** Trecho final da descricao, destacado em negrito. */
    highlight?: string;
};

export default function SectionHeader({
    accent,
    icon,
    eyebrow,
    title,
    description,
    highlight,
}: SectionHeaderProps) {
    const color = `var(--${accent}-color)`;
    const colorRgb = `var(--${accent}-color-rgb)`;

    return (
        <div className="flex w-full flex-col items-center justify-center">
            <div
                className="h-24 w-0.5"
                style={{ background: `linear-gradient(to bottom, transparent, ${color})` }}
            />

            <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-800 dark:text-white"
                style={{
                    fontSize: '17px',
                    outline: `2px solid ${color}`,
                    boxShadow: `0 0 40px 5px rgba(${colorRgb}, .5)`,
                }}
            >
                {icon}
            </div>

            <div className="relative z-10 mx-auto mt-6 max-w-xl text-center">
                <p
                    className="text-sm font-semibold uppercase tracking-widest"
                    style={{ color }}
                >
                    {eyebrow}
                </p>

                <h2 className="mt-1 text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                    {title}
                </h2>

                {description && (
                    <p className="mx-auto mt-2 max-w-lg text-pretty text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {description}
                        {highlight && (
                            <>
                                {' '}
                                <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {highlight}
                                </strong>
                            </>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}
