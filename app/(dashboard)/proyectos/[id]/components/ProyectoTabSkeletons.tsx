export function GeneralTabSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 animate-in fade-in-0 duration-150">
      {/* Columna Lateral */}
      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2.5">
              <div className="size-4 animate-pulse rounded bg-muted shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="size-4 animate-pulse rounded bg-muted shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="size-4 animate-pulse rounded bg-muted shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-44 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* Columna Principal */}
      <div className="space-y-4 lg:col-span-8">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="divide-y divide-border rounded-lg border border-border bg-muted/20">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded bg-muted shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EquipoTabSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in-0 duration-150">
      {/* Banner */}
      <div className="flex items-center justify-between gap-3.5 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
            <div className="h-3 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted shrink-0" />
      </div>

      {/* Grid 2 cols */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Trabajadores */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
                  <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
                  <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-14 animate-pulse rounded bg-muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supervisores */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
                  <th className="px-4 py-2.5"><div className="h-3 w-24 animate-pulse rounded bg-muted" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-36 animate-pulse rounded bg-muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlanificacionTabSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-in fade-in-0 duration-150">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
              <th className="px-4 py-2.5"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></th>
              <th className="px-4 py-2.5"><div className="h-3 w-24 animate-pulse rounded bg-muted" /></th>
              <th className="px-4 py-2.5"><div className="h-3 w-24 animate-pulse rounded bg-muted" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-44 animate-pulse rounded bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-3 w-28 animate-pulse rounded bg-muted" /></td>
                <td className="px-4 py-3"><div className="h-6 w-20 animate-pulse rounded bg-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ComprasTabSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 animate-in fade-in-0 duration-150">
      {/* Órdenes */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 animate-pulse rounded bg-muted" />
          <div className="h-3 w-14 animate-pulse rounded bg-muted" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5"><div className="h-3 w-8 animate-pulse rounded bg-muted" /></th>
                <th className="px-4 py-2.5"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></th>
                <th className="px-4 py-2.5"><div className="h-3 w-14 animate-pulse rounded bg-muted" /></th>
                <th className="px-4 py-2.5"><div className="h-3 w-14 animate-pulse rounded bg-muted" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded bg-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagos */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5"><div className="h-3 w-14 animate-pulse rounded bg-muted" /></th>
                <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
                <th className="px-4 py-2.5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></th>
                <th className="px-4 py-2.5"><div className="h-3 w-14 animate-pulse rounded bg-muted" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded bg-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function CierreTabSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-in fade-in-0 duration-150">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-14 w-full animate-pulse rounded-lg bg-muted/40" />
      <div className="space-y-2">
        <div className="h-3 w-36 animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-28 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
