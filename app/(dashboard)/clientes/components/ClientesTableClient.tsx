'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types/api'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

type EstadoFilter = 'todos' | 'activos' | 'inactivos'

interface Props {
  clientes: Cliente[]
}

export function ClientesTableClient({ clientes }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')

  const filtered = useMemo(() => {
    let result = clientes

    if (estado === 'activos') result = result.filter((c) => c.activo)
    if (estado === 'inactivos') result = result.filter((c) => !c.activo)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (c) =>
          c.razonSocial.toLowerCase().includes(q) ||
          c.nombreComercial?.toLowerCase().includes(q) ||
          c.ruc?.toLowerCase().includes(q),
      )
    }

    return result
  }, [clientes, estado, search])

  const estadoOptions: { value: EstadoFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'activos', label: 'Activos' },
    { value: 'inactivos', label: 'Inactivos' },
  ]

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por razón social, nombre comercial o RUC…"
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

        <Link href="/clientes/nuevo">
          <Button>
            <Plus className='size-4' />
            Registrar Cliente
          </Button>
        </Link>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? `Sin resultados para "${search}"`
              : 'No hay clientes con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Razón Social', 'Nombre Comercial', 'RUC', 'Contactos', 'Proyectos', 'Estado'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/clientes/${c.id}`} className="hover:underline underline-offset-4">
                      {c.razonSocial}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.nombreComercial ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {c.ruc ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c._count?.contactos ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c._count?.proyectos ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        c.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">

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
