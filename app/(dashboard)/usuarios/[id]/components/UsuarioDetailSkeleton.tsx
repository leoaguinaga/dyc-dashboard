export function UsuarioDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-10 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2 rounded-lg border border-border p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-10 shrink-0 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-1">
          <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-3">
          <div className="h-3 w-48 animate-pulse rounded-md bg-muted" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-4">
          <div className="h-3 w-36 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
