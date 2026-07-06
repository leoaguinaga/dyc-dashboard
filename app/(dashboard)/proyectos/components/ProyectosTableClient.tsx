'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Proyecto } from '@/types/api'

type EstadoFilter = 'todos' | Proyecto['estado']
type AmbitoFilter = 'todos' | 'nacional' | 'internacional'

interface Props {
  proyectos: Proyecto[]
}

export function ProyectosTableClient({ proyectos }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')
  const [ambito, setAmbito] = useState<AmbitoFilter>('todos')
  const [ciudad, setCiudad] = useState<string>('todas')

  const years = useMemo(() => {
    const set = new Set(proyectos.map((p) => new Date(p.fechaInicio ?? p.creadaEn).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [proyectos])

  const [year, setYear] = useState<number | null>(null)

  // Ciudades disponibles según el ámbito seleccionado (excluye internacionales)
  const ciudadesDisponibles = useMemo(() => {
    const base = ambito === 'todos'
      ? proyectos.filter((p) => p.ambitoGeografico !== 'internacional')
      : proyectos.filter((p) => p.ambitoGeografico !== 'internacional')
    const set = new Set(base.map((p) => p.ciudad).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [proyectos, ambito])

  // Resetear ciudad cuando cambia el ámbito
  const handleAmbitoChange = (v: string) => {
    setAmbito(v as AmbitoFilter)
    setCiudad('todas')
  }

  const filtered = useMemo(() => {
    let result = proyectos

    if (estado !== 'todos') result = result.filter((p) => p.estado === estado)
    if (year) result = result.filter((p) => new Date(p.fechaInicio ?? p.creadaEn).getFullYear() === year)
    if (ambito === 'internacional') result = result.filter((p) => p.ambitoGeografico === 'internacional')
    if (ambito === 'nacional') result = result.filter((p) => p.ambitoGeografico !== 'internacional')
    if (ciudad !== 'todas') result = result.filter((p) => p.ciudad === ciudad)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo?.toLowerCase().includes(q) ||
          p.cliente?.razonSocial?.toLowerCase().includes(q) ||
          p.cliente?.nombreComercial?.toLowerCase().includes(q) ||
          p.ciudad?.toLowerCase().includes(q),
      )
    }

    return result
  }, [proyectos, estado, year, ambito, ciudad, search])

  const estadoOptions: { value: EstadoFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'planificacion', label: 'Planificación' },
    { value: 'ejecucion', label: 'Ejecución' },
    { value: 'cierre', label: 'Cierre' },
    { value: 'liquidada', label: 'Liquidada' },
  ]

  const ambitoOptions: { value: AmbitoFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'nacional', label: 'Nacional' },
    { value: 'internacional', label: 'Internacional' },
  ]

  const showCiudadFilter = ambito !== 'internacional' && ciudadesDisponibles.length > 1

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-250 ease-out">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
          <SelectTrigger>
            <p>Estado</p>
          </SelectTrigger>
          <SelectContent>
            {estadoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ambito} onValueChange={(v) => handleAmbitoChange(v ?? 'todos')}>
          <SelectTrigger>
            <p>Ubicación</p>
          </SelectTrigger>
          <SelectContent>
            {ambitoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showCiudadFilter && (
          <Select value={ciudad} onValueChange={(v) => setCiudad(v ?? 'todas')}>
            <SelectTrigger>
              <p>Ciudad</p>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {ciudadesDisponibles.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {years.length > 1 && (
          <Select
            value={year?.toString() ?? 'todos'}
            onValueChange={(v) => setYear(!v || v === 'todos' ? null : Number(v))}
          >
            <SelectTrigger>
              <p>Año</p>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Link href="/proyectos/nuevo">
          <Button>
            <Plus className='size-4' />
            Registrar Proyecto
          </Button>
        </Link>
      </div>
      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? `Sin resultados para "${search}"`
              : 'No hay proyectos con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ubicación</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {p.codigo ?? '---'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/proyectos/${p.id}`}
                      className='hover:underline underline-offset-4'
                    >
                      {p.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.cliente?.nombreComercial ?? p.cliente?.razonSocial ?? '---'}</td>
                  <td className="px-4 py-3">
                    <UbicacionCell proyecto={p} />
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={p.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UbicacionCell({ proyecto }: { proyecto: Proyecto }) {
  if (proyecto.ambitoGeografico === 'internacional') {
    return <span className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600">Internacional</span>
  }
  if (proyecto.ciudad) {
    return <span className="text-muted-foreground">{proyecto.ciudad}</span>
  }
  return <span className="text-muted-foreground">Perú</span>
}

function EstadoBadge({ estado }: { estado: Proyecto['estado'] }) {
  const styles: Record<Proyecto['estado'], string> = {
    planificacion: 'bg-blue-500/15 text-blue-600',
    ejecucion: 'bg-chart-2/15 text-chart-2',
    cierre: 'bg-amber-500/15 text-amber-600',
    liquidada: 'bg-muted text-muted-foreground',
  }
  const labels: Record<Proyecto['estado'], string> = {
    planificacion: 'Planificación',
    ejecucion: 'Ejecución',
    cierre: 'Cierre',
    liquidada: 'Liquidada',
  }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', styles[estado])}>
      {labels[estado]}
    </span>
  )
}
