export function ProveedoresTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Razón Social', 'RUC', 'Contacto', 'Teléfono', 'Estado', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-40 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-4 w-28 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-5 w-14 animate-pulse rounded-md bg-muted" /></td>
                <td className="px-4 py-3"><div className="size-7 animate-pulse rounded-md bg-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
