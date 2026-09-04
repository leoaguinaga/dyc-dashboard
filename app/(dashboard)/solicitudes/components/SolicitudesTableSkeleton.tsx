export function SolicitudesTableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded bg-muted" />
        <div className="h-4 w-80 max-w-full rounded bg-muted" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-56 flex-1 rounded-lg bg-muted" />
        <div className="h-8 w-28 rounded-lg bg-muted" />
        <div className="h-8 w-28 rounded-lg bg-muted" />
        <div className="h-8 w-36 rounded-lg bg-muted" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="h-10 bg-muted/50" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-t border-border px-4 py-3">
            <div className="h-8 w-44 rounded bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
            <div className="h-8 flex-1 rounded bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
