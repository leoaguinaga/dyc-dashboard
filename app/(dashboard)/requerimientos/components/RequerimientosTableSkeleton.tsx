export function RequerimientosTableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-muted" />
        <div className="h-8 w-36 rounded-lg bg-muted" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="h-10 bg-muted/50 border-b border-border" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-8 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
