export function ProyectosPageHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
