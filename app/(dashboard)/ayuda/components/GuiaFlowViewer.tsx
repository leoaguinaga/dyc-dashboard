'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Workflow } from 'lucide-react'
import { FLUJOS_GLOBALES } from './guias-data'
import { cn } from '@/lib/utils'

export function GuiaFlowViewer() {
  const [selectedFlowId, setSelectedFlowId] = useState(FLUJOS_GLOBALES[0].id)
  const activeFlow = FLUJOS_GLOBALES.find((f) => f.id === selectedFlowId) ?? FLUJOS_GLOBALES[0]

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Workflow className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Diagramas de Flujo del Sistema
            </h3>
            <p className="text-xs text-muted-foreground">
              Comprende el ciclo de vida de los documentos y la interacción entre áreas.
            </p>
          </div>
        </div>

        {/* Flow Selector */}
        <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-lg">
          {FLUJOS_GLOBALES.map((flow) => (
            <button
              key={flow.id}
              onClick={() => setSelectedFlowId(flow.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                selectedFlowId === flow.id
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              {flow.titulo.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {activeFlow.descripcion}
        </p>

        {/* Stepper Grid / Flow representation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeFlow.fases.map((fase, idx) => (
            <div
              key={fase.numero}
              className="relative flex flex-col justify-between rounded-lg border border-border/80 bg-background p-3.5 space-y-3 transition-colors hover:border-primary/40"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                    {fase.numero}
                  </span>
                  {fase.estadoDoc && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
                      {fase.estadoDoc}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-foreground">{fase.nombre}</h4>
                  <p className="text-[11px] font-medium text-primary mt-0.5">
                    Responsable: <span className="font-normal text-muted-foreground">{fase.responsable}</span>
                  </p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {fase.descripcion}
                </p>
              </div>

              {idx < activeFlow.fases.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  {/* Visual connector indicator */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
