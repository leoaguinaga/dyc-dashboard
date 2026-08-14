import { Check } from 'lucide-react'
import { TIPO_APPROVER_LABEL } from '@/lib/requerimientos'
import type { Requerimiento } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
}

const FLUJO_STEPS = (r: Requerimiento) => [
  { estado: 'borrador', label: 'Borrador' },
  { estado: 'enviado', label: `En revisión`, sub: TIPO_APPROVER_LABEL[r.tipo] },
  { estado: 'aprobado', label: 'Aprobado' },
  { estado: 'en_cotizacion', label: 'En cotización' },
  { estado: 'pendiente_conformidad', label: 'Conformidad' },
  { estado: 'recibido', label: 'Recibido' },
]

export function RequerimientoFlowStepper({ requerimiento: r }: Props) {
  const steps = FLUJO_STEPS(r)
  const stepIdx = steps.findIndex((s) => s.estado === (r.estado === 'observado' ? 'enviado' : r.estado))
  if (stepIdx < 0) return null

  const observado = r.estado === 'observado'

  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4 overflow-x-auto">
      <ol className="flex items-center min-w-max">
        {steps.map((step, i) => {
          const done = stepIdx > i
          const active = stepIdx === i
          const last = i === steps.length - 1
          return (
            <li key={step.estado} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 px-1">
                <span
                  className={[
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-[120ms]',
                    active && observado
                      ? 'bg-amber-500 text-white'
                      : done
                        ? 'bg-chart-2 text-white'
                        : active
                          ? 'bg-primary text-white'
                          : 'border border-border text-muted-foreground bg-muted/30',
                  ].join(' ')}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <div className="text-center leading-tight">
                  <p
                    className={[
                      'text-xs whitespace-nowrap',
                      active ? 'font-semibold text-foreground' : done ? 'font-medium text-chart-2' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {active && observado ? 'Observado' : step.label}
                  </p>
                  {step.sub && (i === stepIdx || i === stepIdx) && (
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{step.sub}</p>
                  )}
                </div>
              </div>
              {!last && (
                <div
                  className={[
                    'h-px w-8 sm:w-14 shrink-0',
                    done ? 'bg-chart-2' : 'bg-border',
                  ].join(' ')}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
