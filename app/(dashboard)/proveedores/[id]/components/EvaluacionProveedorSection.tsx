import { Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProveedorEvaluacion } from '@/types/api'

interface Props {
  evaluacion: ProveedorEvaluacion
}

function scoreColor(score: number | null) {
  if (score === null) return 'bg-muted text-muted-foreground'
  if (score >= 75) return 'bg-chart-2/15 text-chart-2'
  if (score >= 50) return 'bg-amber-500/15 text-amber-600'
  return 'bg-destructive/10 text-destructive'
}

function SubScore({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score !== null ? `${score}%` : 'Sin datos'}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', score !== null ? 'bg-chart-2' : 'bg-transparent')}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  )
}

export function EvaluacionProveedorSection({ evaluacion }: Props) {
  const { puntajeTotal, precioScore, plazosScore, calidadScore, muestraCotizaciones, muestraOCs } = evaluacion

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evaluación</h2>

      <div className="flex items-center gap-3">
        <div className={cn('flex size-14 shrink-0 items-center justify-center rounded-full', scoreColor(puntajeTotal))}>
          <span className="text-lg font-semibold">{puntajeTotal ?? '—'}</span>
        </div>
        <div>
          <p className="text-sm font-medium">Puntaje general</p>
          <p className="text-xs text-muted-foreground">
            Basado en {muestraOCs} orden(es) recibida(s) y {muestraCotizaciones} ítem(s) adjudicado(s)
          </p>
        </div>
        <Gauge className="ml-auto size-5 text-muted-foreground/40" />
      </div>

      <div className="space-y-3">
        <SubScore label="Precio competitivo" score={precioScore} />
        <SubScore label="Cumplimiento de plazos" score={plazosScore} />
        <SubScore label="Calidad" score={calidadScore} />
      </div>
    </div>
  )
}
