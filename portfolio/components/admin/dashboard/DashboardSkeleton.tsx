// components/admin/dashboard/DashboardSkeleton.tsx

/** Espelha o layout real para evitar salto de conteúdo ao carregar. */
export function DashboardSkeleton() {
    return (
        <main className="space-y-6 p-6 lg:p-8" aria-busy="true" aria-live="polite">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
                    <div className="h-4 w-72 animate-pulse rounded bg-muted/60" />
                </div>
                <div className="h-9 w-52 animate-pulse rounded-lg bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[132px] animate-pulse rounded-xl bg-muted" />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="h-[280px] animate-pulse rounded-xl bg-muted xl:col-span-2" />
                <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[320px] animate-pulse rounded-xl bg-muted" />
                ))}
            </div>
        </main>
    );
}
