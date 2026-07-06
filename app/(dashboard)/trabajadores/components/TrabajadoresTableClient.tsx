'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, UserPlus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Trabajador } from '@/types/api'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

type EstadoFilter = 'todos' | 'activos' | 'inactivos'

interface Props {
  trabajadores: Trabajador[]
}

export function TrabajadoresTableClient({ trabajadores }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')

  const cargos = useMemo(() => {
    const set = new Set(trabajadores.map((t) => t.cargo).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [trabajadores])

  const [cargo, setCargo] = useState<string>('todos')

  const filtered = useMemo(() => {
    let result = trabajadores

    if (estado === 'activos') result = result.filter((t) => t.activo)
    if (estado === 'inactivos') result = result.filter((t) => !t.activo)

    if (cargo !== 'todos') result = result.filter((t) => t.cargo === cargo)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.dni.toLowerCase().includes(q) ||
          t.cargo?.toLowerCase().includes(q) ||
          t.telefono?.includes(q),
      )
    }

    return result
  }, [trabajadores, estado, cargo, search])

  const estadoOptions: { value: EstadoFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'activos', label: 'Activos' },
    { value: 'inactivos', label: 'Inactivos' },
  ]

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-250 ease-out">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o cargo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-120"
          />
        </div>
        <Select value={estado} onValueChange={(value) => setEstado(value as EstadoFilter)}>
          <SelectTrigger>
            <p>Estados</p>
          </SelectTrigger>
          <SelectContent>
            {estadoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cargo filter */}
        {cargos.length > 0 && (
          <Select value={cargo} onValueChange={(value) => setCargo(value as string)}>
            <SelectTrigger>
              <p>Cargos</p>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cargos</SelectItem>
              {cargos.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Link href="/trabajadores/nuevo">
          <Button>
            <UserPlus className='size-4' />
            Registrar trabajador
          </Button>
        </Link>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? `Sin resultados para "${search}"`
              : 'No hay trabajadores con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">DNI</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Cargo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Teléfono</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="transition-colors duration-120 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/trabajadores/${t.id}`}
                      className='hover:underline underline-offset-4'
                    >
                      {t.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">{t.dni}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.cargo ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">{t.telefono ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                      t.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
                    )}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
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
