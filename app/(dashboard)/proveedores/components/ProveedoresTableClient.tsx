'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Proveedor } from '@/types/api'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

type EstadoFilter = 'todos' | 'activos' | 'inactivos'

interface Props {
  proveedores: Proveedor[]
}

export function ProveedoresTableClient({ proveedores }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')
  const [departamento, setDepartamento] = useState('todos')

  const departamentos = useMemo(
    () =>
      Array.from(new Set(proveedores.map((p) => p.departamento).filter((d): d is string => !!d))).sort(),
    [proveedores],
  )

  const filtered = useMemo(() => {
    let result = proveedores

    if (estado === 'activos') result = result.filter((p) => p.activo)
    if (estado === 'inactivos') result = result.filter((p) => !p.activo)
    if (departamento !== 'todos') result = result.filter((p) => p.departamento === departamento)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.razonSocial.toLowerCase().includes(q) ||
          p.ruc?.toLowerCase().includes(q) ||
          p.contactos?.some((c) => c.nombre.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)),
      )
    }

    return result
  }, [proveedores, estado, departamento, search])

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC o contacto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={estado} onValueChange={(value) => setEstado(value as EstadoFilter)}>
          <SelectTrigger>
            <p>Estados</p>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departamento} onValueChange={(value) => setDepartamento(value ?? 'todos')}>
          <SelectTrigger>
            <p>{departamento === 'todos' ? 'Departamento' : departamento}</p>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los departamentos</SelectItem>
            {departamentos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link href="/proveedores/nuevo">
          <Button>
            <Plus className="size-4" />
            Registrar proveedor
          </Button>
        </Link>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? `Sin resultados para "${search}"`
              : 'No hay proveedores con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Razón Social</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">RUC</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Categoría</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ubicación</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Contacto principal</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Cotizaciones</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const principal = p.contactos?.find((c) => c.esPrincipal) ?? p.contactos?.[0]
                return (
                  <tr key={p.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/proveedores/${p.id}`} className="hover:underline underline-offset-4">
                        {p.razonSocial}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">{p.ruc ?? '—'}</td>
                    <td className="px-4 py-3">
                      {p.categoria
                        ? (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {p.categoria}
                          </span>
                        )
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.departamento
                        ? (p.distrito ? `${p.distrito}, ${p.departamento}` : p.departamento)
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {principal
                        ? (
                          <div className="leading-tight">
                            <span className="text-foreground font-medium">{principal.nombre}</span>
                            {principal.telefono && (
                              <span className="block text-xs font-mono">{principal.telefono}</span>
                            )}
                          </div>
                        )
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {p._count?.cotizaciones ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        p.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
                      )}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
