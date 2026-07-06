export default function AlmacenDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      {/* Activos table skeleton */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="border-b border-border bg-muted/30 px-4 py-2.5">
          <div className="h-3 w-40 animate-pulse rounded-md bg-muted" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Ítem', 'Código interno', 'Serie', 'Estado'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-44 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-4 w-28 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded-md bg-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
