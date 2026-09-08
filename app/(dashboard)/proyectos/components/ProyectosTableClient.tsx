'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DataTable } from '@/components/shared/data-table/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Proyecto } from '@/types/api'
import { columns, type ProyectoTableRow } from './columns'

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
    const byId = new Map(proyectos.map((proyecto) => [proyecto.id, proyecto]))
    const childrenByParent = new Map<string, Proyecto[]>()

    for (const proyecto of proyectos) {
      if (!proyecto.parentId || !byId.has(proyecto.parentId)) continue
      const siblings = childrenByParent.get(proyecto.parentId) ?? []
      siblings.push(proyecto)
      childrenByParent.set(proyecto.parentId, siblings)
    }

    const visited = new Set<string>()

    const buildTree = (proyecto: Proyecto, ancestors = new Set<string>()): ProyectoTableRow => {
      visited.add(proyecto.id)
      const nextAncestors = new Set(ancestors).add(proyecto.id)
      const children = (childrenByParent.get(proyecto.id) ?? [])
        .filter((child) => !nextAncestors.has(child.id))
        .map((child) => buildTree(child, nextAncestors))

      return { ...proyecto, children: children.length > 0 ? children : undefined }
    }

    const roots = proyectos
      .filter((proyecto) => !proyecto.parentId || !byId.has(proyecto.parentId))
      .map((proyecto) => buildTree(proyecto))

    // Conserva visibles los registros mal enlazados o cíclicos en vez de perderlos.
    for (const proyecto of proyectos) {
      if (!visited.has(proyecto.id)) roots.push(buildTree(proyecto))
    }

    const q = search.trim().toLowerCase()
    const matches = (proyecto: Proyecto) => {
      if (estado !== 'todos' && proyecto.estado !== estado) return false
      if (year && new Date(proyecto.fechaInicio ?? proyecto.creadaEn).getFullYear() !== year) return false
      if (ambito === 'internacional' && proyecto.ambitoGeografico !== 'internacional') return false
      if (ambito === 'nacional' && proyecto.ambitoGeografico === 'internacional') return false
      if (ciudad !== 'todas' && proyecto.ciudad !== ciudad) return false
      if (!q) return true

      return !!(
        proyecto.nombre.toLowerCase().includes(q) ||
        proyecto.codigo?.toLowerCase().includes(q) ||
        proyecto.cliente?.razonSocial?.toLowerCase().includes(q) ||
        proyecto.cliente?.nombreComercial?.toLowerCase().includes(q) ||
        proyecto.ciudad?.toLowerCase().includes(q)
      )
    }

    const filterTree = (row: ProyectoTableRow): ProyectoTableRow | null => {
      if (matches(row)) return row

      const matchingChildren = row.children
        ?.map(filterTree)
        .filter((child): child is ProyectoTableRow => child !== null)

      if (!matchingChildren?.length) return null
      return { ...row, children: matchingChildren, isContextOnly: true }
    }

    return roots
      .map(filterTree)
      .filter((row): row is ProyectoTableRow => row !== null)
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
    <DataTable
      columns={columns}
      data={filtered}
      getSubRows={(row) => row.children}
      getRowId={(row) => row.id}
      defaultExpanded
      emptyMessage={
        search.trim()
          ? `Sin resultados para "${search}"`
          : 'No hay proyectos con los filtros seleccionados'
      }
      toolbar={
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
        </div>
      }
    />
  )
}
