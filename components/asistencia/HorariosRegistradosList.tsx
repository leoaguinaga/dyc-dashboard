import type { TurnoConfig } from '@/types/api'

interface Props {
  horarios: TurnoConfig[]
}

export function HorariosRegistradosList({ horarios }: Props) {
  if (horarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-4 text-center text-sm text-muted-foreground">
        Esta obra todavía no tiene turnos de horario registrados.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {horarios.map((h) => (
        <div
          key={h.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          <span className="font-medium">{h.nombre}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {h.horaInicio} – {h.horaFin}{h.cruzaMedianoche && ' (cruza medianoche)'}
          </span>
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${h.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
            {h.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ))}
    </div>
  )
}
