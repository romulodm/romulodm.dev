// components/admin/dashboard/PeriodSelector.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { Period } from './types';

const PERIODS: Period[] = ['7d', '30d', '90d', '12m'];

/**
 * Filtro global. Sem ele, cada card carrega sua própria janela implícita e o
 * usuário não consegue comparar nada.
 */
export function PeriodSelector({
    value, onChange, disabled,
}: {
    value: Period;
    onChange: (p: Period) => void;
    disabled?: boolean;
}) {
    const t = useTranslations('admin.dashboard.period');

    return (
        <div
            role="radiogroup"
            aria-label={t('label')}
            className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
        >
            {PERIODS.map((p) => {
                const active = p === value;
                return (
                    <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        onClick={() => onChange(p)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${active
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        {t(`options.${p}`)}
                    </button>
                );
            })}
        </div>
    );
}
