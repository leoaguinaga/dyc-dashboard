export function CotizacionesKpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-white p-4 space-y-2 animate-pulse">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-7 w-10 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
