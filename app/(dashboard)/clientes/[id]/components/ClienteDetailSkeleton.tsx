export function ClienteDetailSkeleton() {
  return (
    <>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info panel skeleton */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-0.5 size-4 animate-pulse rounded-md bg-muted" />
                <div className="space-y-1">
                  <div className="h-3 w-12 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contactos panel skeleton */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between py-3 first:pt-0 last:pb-0">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-3 w-10 animate-pulse rounded-md bg-muted shrink-0 ml-4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proyectos panel skeleton */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <div className="h-3 w-16 animate-pulse rounded-md bg-muted" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Código', 'Nombre', 'Estado', 'Inicio'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded-md bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-40 animate-pulse rounded-md bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-14 animate-pulse rounded-md bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded-md bg-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
