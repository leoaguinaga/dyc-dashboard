'use client'

import Link from 'next/link'
import { ClipboardCheck, TriangleAlertIcon } from 'lucide-react'
import type { Proyecto } from '@/types/api'

interface Props {
  proyectos: Proyecto[]
}

export function MisProyectosPdrView({ proyectos }: Props) {
  if (proyectos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
        No tienes obras asignadas como prevencionista de riesgos.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {proyectos.map((p) => {
        const jornadaConfigurada = !!p.jornadaInicio && !!p.jornadaFin
        return (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium">{p.nombre}</p>
              {p.codigo && <p className="text-xs text-muted-foreground font-mono">{p.codigo}</p>}
              {!jornadaConfigurada && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <TriangleAlertIcon className="size-3" />
                  Jornada de asistencia sin configurar
                </p>
              )}
            </div>
            <Link
              href={`/asistencia/turno/${p.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms] hover:bg-muted"
            >
              <ClipboardCheck className="size-3.5" />
              Ir al turno
            </Link>
          </div>
        )
      })}
    </div>
  )
}
