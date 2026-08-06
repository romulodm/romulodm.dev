/**
 * Skeleton da listagem do blog. Sem `loading.tsx` o Next segura a navegacao na
 * pagina anterior enquanto as queries rodam, e o clique parece nao ter
 * funcionado.
 */
export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="mb-10 space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 max-w-xl animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-44 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
