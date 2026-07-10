export function NotificacionesTableSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-border">
      <div className="h-10 border-b border-border bg-muted/50" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-4 flex-1 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
