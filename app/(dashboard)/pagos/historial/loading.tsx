export default function PagosHistorialLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      {/* Encabezado esqueleto */}
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-muted/60" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-7 w-56 rounded-md bg-muted/60" />
            <div className="h-4 w-80 rounded bg-muted/40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 rounded-lg bg-muted/50" />
            <div className="h-8 w-28 rounded-lg bg-muted/50" />
          </div>
        </div>
      </div>

      {/* KPI Cards esqueleto */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white p-4 space-y-2"
          >
            <div className="h-3 w-24 rounded bg-muted/50" />
            <div className="h-6 w-32 rounded bg-muted/70" />
            <div className="h-3 w-20 rounded bg-muted/40" />
          </div>
        ))}
      </div>

      {/* Barra de Filtros esqueleto */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-8 flex-1 min-w-[200px] rounded-lg bg-muted/40" />
        <div className="h-8 w-28 rounded-lg bg-muted/40" />
        <div className="h-8 w-32 rounded-lg bg-muted/40" />
        <div className="h-8 w-20 rounded-lg bg-muted/40" />
      </div>

      {/* Tabla esqueleto */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="h-10 border-b border-border bg-muted/30" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border last:border-b-0 bg-muted/15 flex items-center px-4 justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-muted/40" />
              <div className="space-y-1">
                <div className="h-3.5 w-32 rounded bg-muted/50" />
                <div className="h-2.5 w-24 rounded bg-muted/30" />
              </div>
            </div>
            <div className="h-4 w-20 rounded bg-muted/40" />
            <div className="h-4 w-24 rounded bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  )
}
