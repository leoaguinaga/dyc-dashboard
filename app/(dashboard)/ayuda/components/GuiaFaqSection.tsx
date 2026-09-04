'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Search,
} from 'lucide-react'
import type { GuiaFaq } from './guias-data'
import { cn } from '@/lib/utils'

interface Props {
  faqs: GuiaFaq[]
  selectedRoleKey?: string
}

const CATEGORIAS = [
  { id: 'todos', label: 'Todas las preguntas' },
  { id: 'requerimientos', label: 'Requerimientos' },
  { id: 'asistencia', label: 'Asistencia y Tareo' },
  { id: 'cotizaciones', label: 'Cotizaciones y OCs' },
  { id: 'compras', label: 'Compras Simples' },
  { id: 'finanzas', label: 'Finanzas y Pagos' },
  { id: 'usuarios', label: 'Usuarios y Accesos' },
] as const

export function GuiaFaqSection({ faqs }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return faqs.filter((f) => {
      const matchCat = selectedCategoria === 'todos' || f.categoria === selectedCategoria
      const matchQuery =
        !q ||
        f.pregunta.toLowerCase().includes(q) ||
        f.respuesta.toLowerCase().includes(q) ||
        f.solucionPasoAPaso?.some((s) => s.toLowerCase().includes(q))
      return matchCat && matchQuery
    })
  }, [faqs, search, selectedCategoria])

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Preguntas Frecuentes y Solución de Problemas (FAQ)
            </h3>
            <p className="text-xs text-muted-foreground">
              Respuestas rápidas a las consultas y dudas más comunes en el uso del sistema.
            </p>
          </div>
        </div>

        {/* FAQ Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en preguntas frecuentes..."
            className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoria(cat.id)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              selectedCategoria === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <p className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
            No se encontraron preguntas frecuentes para los criterios seleccionados.
          </p>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openIds.has(faq.id)
            return (
              <div
                key={faq.id}
                className="rounded-lg border border-border bg-background transition-all duration-150 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-muted/40"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                    {faq.pregunta}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/15 p-3.5 sm:p-4 space-y-3 text-xs text-muted-foreground animate-in fade-in-50 duration-150">
                    <p className="leading-relaxed text-foreground/90">{faq.respuesta}</p>

                    {faq.solucionPasoAPaso && faq.solucionPasoAPaso.length > 0 && (
                      <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                        <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
                          Pasos de solución recomendados:
                        </span>
                        <ol className="space-y-1.5 list-decimal list-inside leading-relaxed">
                          {faq.solucionPasoAPaso.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {faq.moduloHref && (
                      <div className="pt-1">
                        <Link
                          href={faq.moduloHref}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          {faq.moduloLabel ?? 'Ir al módulo'}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
