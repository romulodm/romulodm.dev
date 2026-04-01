interface Props {
    onReset: () => void
}

export function SuccessView({ onReset }: Props) {
    return (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-5xl mb-3">☕</p>
            <h3 className="text-xl font-bold text-foreground mb-2">Obrigado pelo café!</h3>
            <p className="text-muted-foreground text-sm mb-5">
                Seu apoio significa muito. Continue acompanhando o blog!
            </p>
            <button
                onClick={onReset}
                className="px-6 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition text-foreground"
            >
                Apoiar novamente
            </button>
        </div>
    )
}