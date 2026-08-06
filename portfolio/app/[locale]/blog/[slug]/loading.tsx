/**
 * Skeleton do post. A pagina faz markdown + comentarios + relacionados em
 * paralelo; sem isso a navegacao fica travada na listagem sem feedback.
 */
export default function PostLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-64 w-full animate-pulse rounded-2xl bg-muted md:h-96" />

          <div className="space-y-3">
            <div className="h-9 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-9 w-3/5 animate-pulse rounded bg-muted" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>

          <div className="space-y-3 pt-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-muted"
                style={{ width: `${70 + ((i * 13) % 30)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
