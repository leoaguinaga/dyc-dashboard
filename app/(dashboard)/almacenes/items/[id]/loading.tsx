export default function ItemDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>

      {/* Detail card */}
      <div className="rounded-xl border border-border p-5 space-y-4">
        <div className="h-3 w-12 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
