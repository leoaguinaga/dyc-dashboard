interface Props {
  /** Filas «etiqueta → valor» del resumen. */
  filas: Array<{ label: string; value: React.ReactNode; title?: string }>
  children?: React.ReactNode
}

/** Resumen lateral común: lista descriptiva más un espacio propio de cada flujo. */
export function ResumenCard({ filas, children }: Props) {
  return (
    <aside aria-labelledby="reg-resumen" className="rounded-xl border border-border bg-white p-4 lg:sticky lg:top-4">
      <h2 id="reg-resumen" className="mb-3 text-sm font-medium">Resumen</h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        {filas.map((f) => (
          <div key={f.label} className="contents">
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd className="truncate text-right font-medium tabular-nums" title={f.title}>{f.value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </aside>
  )
}
