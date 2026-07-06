export function CotizacionesTableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 w-full rounded-lg bg-muted" />
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="h-10 border-b border-border bg-muted/50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
