'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import type { GuiaProceso } from './guias-data'
import { cn } from '@/lib/utils'

interface Props {
  proceso: GuiaProceso
}

export function GuiaProcessCard({ proceso }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs transition-all duration-200 hover:border-primary/30">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {proceso.modulo}
              </span>
              {proceso.etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="text-base font-semibold text-foreground leading-snug">
              {proceso.titulo}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {proceso.subtitulo}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
            {proceso.href && (
              <Link
                href={proceso.href}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                Abrir módulo
                <ArrowUpRight className="size-3.5" />
              </Link>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
              aria-label={expanded ? 'Ocultar pasos' : 'Ver pasos'}
            >
              {expanded ? 'Ocultar guía' : 'Ver paso a paso'}
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Objective Highlight */}
        <div className="mt-3.5 rounded-lg bg-muted/40 p-2.5 sm:p-3 text-xs text-muted-foreground flex items-start gap-2 border border-border/60">
          <Info className="size-4 shrink-0 text-primary mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Objetivo del proceso: </span>
            {proceso.objetivo}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 sm:p-5 space-y-6 animate-in fade-in-50 duration-200">
          {/* Steps */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Pasos para completar el proceso
            </h4>

            <div className="space-y-3">
              {proceso.pasos.map((paso) => (
                <div
                  key={paso.numero}
                  className="rounded-lg border border-border bg-background p-3.5 space-y-2.5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                      {paso.numero}
                    </span>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h5 className="text-xs sm:text-sm font-semibold text-foreground">
                        {paso.titulo}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {paso.descripcion}
                      </p>
                    </div>
                  </div>

                  {paso.detalle && paso.detalle.length > 0 && (
                    <ul className="ml-9 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                      {paso.detalle.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}

                  {paso.tip && (
                    <div className="ml-9 flex items-start gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-emerald-600" />
                      <span>{paso.tip}</span>
                    </div>
                  )}

                  {paso.advertencia && (
                    <div className="ml-9 flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-800 dark:text-amber-300">
                      <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span>{paso.advertencia}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document States if available */}
          {proceso.estados && proceso.estados.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estados de este documento
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {proceso.estados.map((est) => (
                  <div
                    key={est.estado}
                    className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5 text-xs"
                  >
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-semibold shrink-0',
                      est.color === 'green' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                      est.color === 'blue' && 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
                      est.color === 'amber' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                      est.color === 'purple' && 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
                      est.color === 'slate' && 'bg-muted text-muted-foreground',
                      est.color === 'red' && 'bg-red-500/15 text-red-700 dark:text-red-300',
                    )}>
                      {est.estado}
                    </span>
                    <span className="text-muted-foreground">{est.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {proceso.buenasPracticas && proceso.buenasPracticas.length > 0 && (
            <div className="rounded-lg border border-border bg-background p-3.5 space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600" />
                Recomendaciones y Buenas Prácticas
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {proceso.buenasPracticas.map((bp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
