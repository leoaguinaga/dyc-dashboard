'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Proveedor } from '@/types/api'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { CATEGORIAS_PROVEEDOR } from '@/lib/proveedores'
import { datosIncompletos, detectarDuplicados, formatSoles, haceCuanto } from './utils'

type EstadoFilter = 'todos' | 'activos' | 'inactivos'

const ESTADO_LABEL: Record<EstadoFilter, string> = {
  todos: 'Estado',
  activos: 'Solo activos',
  inactivos: 'Solo inactivos',
}

const TH = 'px-4 py-2.5 text-left text-sm font-medium text-muted-foreground'
const EMPTY = <span className="text-muted-foreground/40">—</span>

interface Props {
  proveedores: Proveedor[]
}

export function ProveedoresTableClient({ proveedores }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')
  const [departamento, setDepartamento] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [soloIncompletos, setSoloIncompletos] = useState(false)

  const departamentos = useMemo(
    () =>
      Array.from(new Set(proveedores.map((p) => p.departamento).filter((d): d is string => !!d))).sort(),
    [proveedores],
  )
  const duplicados = useMemo(() => detectarDuplicados(proveedores), [proveedores])
  const totalIncompletos = useMemo(
    () => proveedores.filter((p) => p.activo && datosIncompletos(p)).length,
    [proveedores],
  )

  const filtered = useMemo(() => {
    let result = proveedores

    if (estado === 'activos') result = result.filter((p) => p.activo)
    if (estado === 'inactivos') result = result.filter((p) => !p.activo)
    if (departamento !== 'todos') result = result.filter((p) => p.departamento === departamento)
    if (categoria !== 'todas') result = result.filter((p) => p.categoria === categoria)
    if (soloIncompletos) result = result.filter(datosIncompletos)

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
  }, [proveedores, estado, departamento, categoria, soloIncompletos, search])

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="Buscar proveedores"
            placeholder="Buscar por razón social, RUC o contacto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
          <SelectTrigger>
            <p>{ESTADO_LABEL[estado]}</p>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activos">Solo activos</SelectItem>
            <SelectItem value="inactivos">Solo inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoria} onValueChange={(v) => setCategoria(v ?? 'todas')}>
          <SelectTrigger>
            <p>{categoria === 'todas' ? 'Categoría' : categoria}</p>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIAS_PROVEEDOR.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departamento} onValueChange={(v) => setDepartamento(v ?? 'todos')}>
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
        <button
          type="button"
          aria-pressed={soloIncompletos}
          onClick={() => setSoloIncompletos((v) => !v)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-colors duration-[120ms]',
            soloIncompletos
              ? 'border-chart-3/50 bg-chart-3/15 text-foreground'
              : 'border-border text-muted-foreground hover:bg-muted/50',
          )}
        >
          <AlertTriangle className="size-3.5" />
          Datos incompletos
          <span className="tabular-nums text-xs">{totalIncompletos}</span>
        </button>
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
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className={TH}>Proveedor</th>
                <th className={TH}>Categoría y ubicación</th>
                <th className={TH}>Contacto</th>
                <th className={TH}>Actividad</th>
                <th className={cn(TH, 'text-right')}>Comprado</th>
                <th className={TH}>Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const principal = p.contactos?.find((c) => c.esPrincipal) ?? p.contactos?.[0]
                const a = p.actividad
                const cots = p._count?.cotizaciones ?? 0
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      'transition-colors duration-[120ms] hover:bg-muted/40',
                      !p.activo && 'opacity-60',
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/proveedores/${p.id}`} className="font-medium hover:underline underline-offset-4">
                        {p.razonSocial}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">{p.ruc ?? 'Sin RUC'}</span>
                        {!p.activo && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Inactivo
                          </span>
                        )}
                        {duplicados.has(p.id) && (
                          <span className="rounded-md bg-chart-3/15 px-1.5 py-0.5 text-xs font-medium text-foreground">
                            Posible duplicado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.categoria ? (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {p.categoria}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-chart-3/15 px-2 py-0.5 text-xs font-medium text-foreground">
                          Sin categoría
                        </span>
                      )}
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {p.departamento
                          ? p.distrito ? `${p.distrito}, ${p.departamento}` : p.departamento
                          : EMPTY}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {principal ? (
                        <div className="leading-tight">
                          <span className="font-medium">{principal.nombre}</span>
                          {principal.telefono && (
                            <span className="block font-mono text-xs text-muted-foreground">{principal.telefono}</span>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={`/proveedores/${p.id}`}
                          className="text-sm text-primary hover:underline underline-offset-4"
                        >
                          Agregar contacto
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs">
                        {cots} cot. · {a?.ordenes ?? 0} OC
                      </div>
                      <div className="text-xs text-muted-foreground">{haceCuanto(a?.ultimaActividad)}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {a && a.montoTotal > 0 ? formatSoles(a.montoTotal) : EMPTY}
                    </td>
                    <td className="px-4 py-3">
                      {a?.puntaje != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-14 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <div className="h-full bg-chart-2" style={{ width: `${a.puntaje}%` }} />
                          </div>
                          <span className="font-mono text-xs">{a.puntaje}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin datos</span>
                      )}
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
