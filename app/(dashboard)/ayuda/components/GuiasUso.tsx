'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronRight, Library, Search, X } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import type { HelpVideo, Role } from '@/types/api'
import {
  categoriaFaqParaModulo,
  guiaVisibleParaRol,
  GUIAS_FAQS,
  GUIAS_PROCESOS,
  textoBusquedaGuia,
} from '../catalogo'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GuiaReader } from './GuiaReader'

interface Props {
  videos?: HelpVideo[]
}

export function GuiasUso({ videos = [] }: Props) {
  const { data: session } = useSession()
  const userRole = session?.user?.role as Role | undefined
  const [search, setSearch] = useState('')
  const [selectedModule, setSelectedModule] = useState('todos')
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false)
  const readerScrollRef = useRef<HTMLDivElement>(null)

  const accessibleGuides = useMemo(
    () => GUIAS_PROCESOS.filter((guia) => guiaVisibleParaRol(guia.rolesAplicables, userRole)),
    [userRole],
  )

  const modules = useMemo(() => {
    const counts = new Map<string, number>()
    accessibleGuides.forEach((guia) => counts.set(guia.modulo, (counts.get(guia.modulo) ?? 0) + 1))
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([id, count]) => ({ id, label: id, count }))
  }, [accessibleGuides])

  const filteredGuides = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return accessibleGuides.filter((guia) => {
      const matchesModule = selectedModule === 'todos' || guia.modulo === selectedModule
      const matchesSearch = !query || textoBusquedaGuia(guia).includes(query)
      return matchesModule && matchesSearch
    })
  }, [accessibleGuides, search, selectedModule])

  const selectedGuide = filteredGuides.find((guia) => guia.id === selectedGuideId) ?? filteredGuides[0] ?? null
  const relatedGuides = selectedGuide
    ? accessibleGuides.filter((guia) => guia.id !== selectedGuide.id && guia.modulo === selectedGuide.modulo)
    : []
  const relatedFaqs = selectedGuide
    ? GUIAS_FAQS.filter((faq) => faq.categoria === categoriaFaqParaModulo(selectedGuide.modulo) && guiaVisibleParaRol(faq.rolesAplicables, userRole))
    : []
  const relatedVideos = selectedGuide
    ? videos.filter((video) => video.modulo.toLocaleLowerCase('es').includes(selectedGuide.modulo.toLocaleLowerCase('es')) && guiaVisibleParaRol(video.roles, userRole))
    : []

  useEffect(() => {
    readerScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [selectedGuide?.id])

  function selectGuide(id: string) {
    setSelectedGuideId(id)
    setMobileReaderOpen(true)
  }

  function clearFilters() {
    setSearch('')
    setSelectedModule('todos')
    setSelectedGuideId(null)
  }

  return (
    <section aria-labelledby="ayuda-page-heading" className="min-w-0 max-w-full space-y-5">
      {/* Buscador y filtro por módulo */}
      <div
        role="search"
        aria-label="Buscar en la biblioteca"
        className={cn('flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5', mobileReaderOpen && 'hidden lg:flex')}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="library-search"
            type="text"
            role="searchbox"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="¿Qué necesitas hacer? Ej. crear un requerimiento"
            className="h-10 w-full rounded-xl border border-input bg-card pl-8 pr-9 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <Select value={selectedModule} onValueChange={(v) => setSelectedModule(v ?? 'todos')}>
          <SelectTrigger className="min-h-10 w-full sm:w-56 shrink-0 rounded-xl bg-card border-input shadow-xs">
            <SelectValue>
              {(value: string | null) => {
                if (!value || value === 'todos') return 'Todas las guías'
                return modules.find((m) => m.id === value)?.label ?? value
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-56">
            <SelectItem value="todos">
              <span>Todas las guías</span>
              <span className="text-xs text-muted-foreground ml-auto font-mono">({accessibleGuides.length})</span>
            </SelectItem>
            {modules.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span>{m.label}</span>
                <span className="text-xs text-muted-foreground ml-auto font-mono">({m.count})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid lg:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.68fr)]">
        <div className={cn('min-w-0 border-border lg:block lg:max-h-[calc(100dvh-18rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:[scrollbar-gutter:stable]', mobileReaderOpen && 'hidden')}>
          <div className="sticky top-0 z-10 flex min-h-12 items-center justify-between border-b border-border bg-card px-4">
            <p aria-live="polite" className="text-sm font-semibold text-foreground">{filteredGuides.length} {filteredGuides.length === 1 ? 'guía' : 'guías'}</p>
            {(search || selectedModule !== 'todos') && <button type="button" onClick={clearFilters} className="min-h-10 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Limpiar filtros</button>}
          </div>

          {filteredGuides.length ? (
            <ul className="divide-y divide-border">
              {filteredGuides.map((guia) => {
                const isSelected = selectedGuide?.id === guia.id
                return (
                  <li key={guia.id}>
                    <button type="button" onClick={() => selectGuide(guia.id)} aria-current={isSelected ? 'true' : undefined} className={cn('group flex min-h-24 w-full items-start gap-3 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', isSelected ? 'bg-primary/7' : 'hover:bg-muted/40')}>
                      <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg', isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground')}><BookOpen className="size-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm font-semibold leading-5', isSelected ? 'text-primary' : 'text-foreground')}>{guia.titulo}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{guia.modulo} · {guia.pasos.length} {guia.pasos.length === 1 ? 'paso' : 'pasos'}</span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{guia.subtitulo}</span>
                      </span>
                      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"><Library className="size-5" /></span>
              <h3 className="mt-4 text-base font-semibold text-foreground">No encontramos una guía</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Prueba con el nombre de una acción, un estado o el módulo donde trabajas.</p>
              <button type="button" onClick={clearFilters} className="mt-4 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver todas las guías</button>
            </div>
          )}
        </div>

        <div ref={readerScrollRef} className={cn('min-w-0 lg:max-h-[calc(100dvh-18rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]', !mobileReaderOpen && 'hidden lg:block')}>
          {selectedGuide ? (
            <GuiaReader guia={selectedGuide} relacionadas={relatedGuides} faqs={relatedFaqs} videos={relatedVideos} onSelect={selectGuide} onBack={() => setMobileReaderOpen(false)} />
          ) : (
            <div className="hidden min-h-96 items-center justify-center p-8 text-center lg:flex"><p className="max-w-sm text-sm leading-6 text-muted-foreground">Selecciona otra funcionalidad o limpia los filtros para continuar.</p></div>
          )}
        </div>
      </div>
      {/* {userRole === 'admin_ti' ? (
        <details className="rounded-xl border border-border bg-card">
          <summary className="flex min-h-14 cursor-pointer items-center px-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            Administrar videos tutoriales
          </summary>
          <div className="border-t border-border p-4 sm:p-6">
            <AyudaBoard initialVideos={videos} />
          </div>
        </details>
      ) : null} */}
    </section>
  )
}
