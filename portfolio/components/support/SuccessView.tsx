import { useTranslations } from 'next-intl'

interface Props {
    onReset: () => void
}

export function SuccessView({ onReset }: Props) {
    const t = useTranslations('support')

    return (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-5xl mb-3">☕</p>
            <h3 className="type-h3 text-foreground mb-2">{t('success.title')}</h3>
            <p className="text-muted-foreground text-sm mb-5">
                {t('success.description')}
            </p>
            <button
                onClick={onReset}
                className="px-6 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition text-foreground"
            >
                {t('success.supportAgain')}
            </button>
        </div>
    )
}
