'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  CheckCheck,
  PackageOpen,
  PencilLine,
  Search,
  Send,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import { ordenBasePath, ocTotalConIgv } from '@/lib/ordenes'
import type { EstadoOrdenCompra, OrdenCompra, TipoOrdenCompra } from '@/types/api'

const PAGE_SIZE = 25

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recep. parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_ICON: Record<EstadoOrdenCompra, LucideIcon> = {
  borrador: PencilLine,
  emitida: Send,
  recibida_parcial: PackageOpen,
  recibida: CheckCheck,
  cancelada: Ban,
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-primary/10 text-primary',
  recibida_parcial: 'bg-chart-3/15 text-amber-700',
  recibida: 'bg-chart-2/15 text-emerald-700',
  cancelada: 'bg-destructive/10 text-destructive',
}

const TIPO_LABEL: Record<TipoOrdenCompra, string> = {
  compra: 'Compra',
  servicio: 'Servicio',
}

type TabId = 'todas' | 'atrasadas' | 'borrador' | 'entrega' | 'pago' | 'cerradas'
type TipoFilter = 'todos' | TipoOrdenCompra
type SortKey = 'urgencia' | 'numero' | 'entrega' | 'monto'
type SortDir = 'asc' | 'desc'

const TAB_LABEL: Record<TabId, string> = {
  todas: 'Todas',
  atrasadas: 'Atrasadas',
  borrador: 'Por emitir',
  entrega: 'Esperando recepción',
  pago: 'Por pagar',
  cerradas: 'Cerradas',
}

const TAB_IDS: TabId[] = ['todas', 'atrasadas', 'borrador', 'entrega', 'pago', 'cerradas']
const SORT_KEYS: SortKey[] = ['urgencia', 'numero', 'entrega', 'monto']

const subscribeNever = () => () => {}

function diaActualMs() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

function diasHasta(fecha: string | undefined, hoy: Date | null): number | null {
  if (!fecha || !hoy) return null
  const [y, m, d] = fecha.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d)
  return Math.round((target.getTime() - hoy.getTime()) / 86_400_000)
}

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function pagadoDe(oc: OrdenCompra) {
  return (oc.pagos ?? [])
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + Number(p.monto || 0), 0)
}

function estaPorPagar(oc: OrdenCompra, total: number) {
  if (oc.estado === 'borrador' || oc.estado === 'cancelada') return false
  return pagadoDe(oc) < total - 0.005
}

function estaAbierta(oc: OrdenCompra) {
  return oc.estado === 'emitida' || oc.estado === 'recibida_parcial'
}

interface Props {
  ordenes: OrdenCompra[]
}

export function OrdenesCompraTableClient({ ordenes }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get('tab') as TabId | null
  const tab: TabId = tabParam && TAB_IDS.includes(tabParam) ? tabParam : 'todas'
  const tipo: TipoFilter = searchParams.get('tipo') === 'compra' ? 'compra' : searchParams.get('tipo') === 'servicio' ? 'servicio' : 'todos'
  const proyectoId = searchParams.get('proyecto') ?? 'todos'
  const [sortRaw, dirRaw] = (searchParams.get('orden') ?? '').split(':')
  const sortKey: SortKey = SORT_KEYS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : 'urgencia'
  const sortDir: SortDir = dirRaw === 'asc' ? 'asc' : 'desc'
  const qParam = searchParams.get('q') ?? ''

  const [search, setSearch] = useState(qParam)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const hoyMs = useSyncExternalStore(subscribeNever, diaActualMs, () => null)
  const hoy = useMemo(() => (hoyMs === null ? null : new Date(hoyMs)), [hoyMs])

  function setParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '' || value === 'todos' || (key === 'tab' && value === 'todas')) next.delete(key)
      else next.set(key, value)
    }
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setVisible(PAGE_SIZE)
  }

  useEffect(() => {
    if (search === qParam) return
    const timer = setTimeout(() => setParams({ q: search.trim() }), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const proyectos = useMemo(() => {
    const map = new Map<string, string>()
    for (const oc of ordenes) {
      if (!map.has(oc.proyectoId)) map.set(oc.proyectoId, oc.proyecto.codigo ?? oc.proyecto.nombre)
    }
    return [...map.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [ordenes])

  const base = useMemo(() => {
    let result = ordenes
    if (tipo !== 'todos') result = result.filter((oc) => oc.tipo === tipo)
    if (proyectoId !== 'todos') result = result.filter((oc) => oc.proyectoId === proyectoId)
    const q = qParam.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (oc) =>
          oc.numero.toLowerCase().includes(q) ||
          oc.nombre?.toLowerCase().includes(q) ||
          oc.proveedor?.razonSocial.toLowerCase().includes(q) ||
          oc.proveedorNombreLibre?.toLowerCase().includes(q) ||
          oc.proyecto.nombre.toLowerCase().includes(q) ||
          oc.proyecto.codigo?.toLowerCase().includes(q) ||
          oc.solicitud?.codigo.toLowerCase().includes(q),
      )
    }
    return result
  }, [ordenes, tipo, proyectoId, qParam])

  const esAtrasada = (oc: OrdenCompra) => {
    const dias = diasHasta(oc.fechaEntrega, hoy)
    return estaAbierta(oc) && dias !== null && dias < 0
  }

  const counts = useMemo(() => {
    const c: Record<TabId, number> = { todas: base.length, atrasadas: 0, borrador: 0, entrega: 0, pago: 0, cerradas: 0 }
    for (const oc of base) {
      const dias = diasHasta(oc.fechaEntrega, hoy)
      if (estaAbierta(oc) && dias !== null && dias < 0) c.atrasadas++
      if (oc.estado === 'borrador') c.borrador++
      if (estaAbierta(oc)) c.entrega++
      if (estaPorPagar(oc, ocTotalConIgv(oc))) c.pago++
      if (oc.estado === 'cancelada' || (oc.estado === 'recibida' && !estaPorPagar(oc, ocTotalConIgv(oc)))) c.cerradas++
    }
    return c
  }, [base, hoy])

  const comprometido = useMemo(
    () =>
      ordenes
        .filter((oc) => oc.estado !== 'borrador' && oc.estado !== 'cancelada')
        .reduce((sum, oc) => sum + ocTotalConIgv(oc), 0),
    [ordenes],
  )

  const enTab = useMemo(() => {
    switch (tab) {
      case 'atrasadas':
        return base.filter(esAtrasada)
      case 'borrador':
        return base.filter((oc) => oc.estado === 'borrador')
      case 'entrega':
        return base.filter(estaAbierta)
      case 'pago':
        return base.filter((oc) => estaPorPagar(oc, ocTotalConIgv(oc)))
      case 'cerradas':
        return base.filter(
          (oc) => oc.estado === 'cancelada' || (oc.estado === 'recibida' && !estaPorPagar(oc, ocTotalConIgv(oc))),
        )
      default:
        return base
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, tab, hoy])

  const sorted = useMemo(() => {
    const list = [...enTab]
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'numero') return list.sort((a, b) => a.numero.localeCompare(b.numero) * dir)
    if (sortKey === 'monto') return list.sort((a, b) => (ocTotalConIgv(a) - ocTotalConIgv(b)) * dir)
    if (sortKey === 'entrega') {
      return list.sort((a, b) => {
        if (!a.fechaEntrega && !b.fechaEntrega) return 0
        if (!a.fechaEntrega) return 1
        if (!b.fechaEntrega) return -1
        return a.fechaEntrega.localeCompare(b.fechaEntrega) * dir
      })
    }
    const rango = (oc: OrdenCompra) => {
      if (esAtrasada(oc)) return 0
      if (estaAbierta(oc)) return 1
      if (oc.estado === 'borrador') return 2
      if (estaPorPagar(oc, ocTotalConIgv(oc))) return 3
      return 4
    }
    return list.sort((a, b) => {
      const r = rango(a) - rango(b)
      if (r !== 0) return r
      if (rango(a) <= 1) return (a.fechaEntrega ?? '9999').localeCompare(b.fechaEntrega ?? '9999')
      return b.creadoEn.localeCompare(a.creadoEn)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enTab, sortKey, sortDir, hoy])

  const shown = sorted.slice(0, visible)
  const hayFiltros = tipo !== 'todos' || proyectoId !== 'todos' || qParam.trim() !== '' || tab !== 'todas'
  const proyectoLabel = proyectos.find((p) => p.id === proyectoId)?.label

  function toggleSort(key: Exclude<SortKey, 'urgencia'>) {
    if (sortKey !== key) setParams({ orden: `${key}:${key === 'monto' ? 'desc' : 'asc'}` })
    else if (sortDir === 'asc') setParams({ orden: `${key}:desc` })
    else setParams({ orden: null })
  }

  function limpiar() {
    setSearch('')
    router.replace(pathname, { scroll: false })
    setVisible(PAGE_SIZE)
  }

  function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (sortKey !== key) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  function renderSortHeader({ k, label, align = 'left' }: { k: Exclude<SortKey, 'urgencia'>; label: string; align?: 'left' | 'right' }) {
    const Icon = sortKey !== k ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th
        key={k}
        scope="col"
        aria-sort={ariaSort(k)}
        className={cn('px-4 py-2.5 font-medium text-muted-foreground', align === 'right' ? 'text-right' : 'text-left')}
      >
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={cn(
            'inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
            sortKey === k && 'text-foreground',
          )}
        >
          {label}
          <Icon className="size-3" aria-hidden="true" />
        </button>
      </th>
    )
  }

  const visibleTabs = TAB_IDS.filter((id) => id !== 'atrasadas' || counts.atrasadas > 0 || tab === 'atrasadas')

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">{formatCurrency(comprometido)}</span> comprometido
        {' · '}
        <span className="tabular-nums">{counts.entrega}</span> esperando recepción
        {counts.atrasadas > 0 && (
          <>
            {' · '}
            <button
              type="button"
              onClick={() => setParams({ tab: 'atrasadas' })}
              className="font-medium text-destructive underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {counts.atrasadas} {counts.atrasadas === 1 ? 'atrasada' : 'atrasadas'}
            </button>
          </>
        )}
      </p>

      <div role="tablist" aria-label="Filtrar órdenes por situación" className="flex flex-wrap gap-1.5">
        {visibleTabs.map((id) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ tab: id })}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-ring',
                active
                  ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                id === 'atrasadas' && !active && 'text-destructive',
              )}
            >
              {TAB_LABEL[id]}
              <span className="tabular-nums text-xs opacity-80">{counts[id]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar órdenes"
            placeholder="Buscar orden, proveedor, proyecto o solicitud…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </div>
        <Select value={tipo} onValueChange={(v) => setParams({ tipo: v })}>
          <SelectTrigger className="w-40" aria-label="Filtrar por tipo">
            <SelectValue>{tipo === 'todos' ? 'Compras y servicios' : TIPO_LABEL[tipo]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Compras y servicios</SelectItem>
            <SelectItem value="compra">Compra</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={proyectoId} onValueChange={(v) => setParams({ proyecto: v })}>
          <SelectTrigger className="w-44" aria-label="Filtrar por proyecto">
            <SelectValue>{proyectoId === 'todos' ? 'Todos los proyectos' : (proyectoLabel ?? 'Proyecto')}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los proyectos</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hayFiltros && (
          <button
            type="button"
            onClick={limpiar}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
            Limpiar
          </button>
        )}
        <span className="ml-auto text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {sorted.length} de {ordenes.length}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-border bg-card py-16 text-center">
          <p className="text-sm font-medium">
            {qParam.trim() ? `Sin resultados para "${qParam}"` : 'No hay órdenes en esta vista'}
          </p>
          {hayFiltros && (
            <button type="button" onClick={limpiar} className="text-sm text-primary hover:underline">
              Ver todas las órdenes
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {renderSortHeader({ k: 'numero', label: 'Orden' })}
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-muted-foreground">Proveedor y proyecto</th>
                {renderSortHeader({ k: 'entrega', label: 'Entrega' })}
                {renderSortHeader({ k: 'monto', label: 'Monto', align: 'right' })}
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((oc) => {
                const total = ocTotalConIgv(oc)
                const dias = diasHasta(oc.fechaEntrega, hoy)
                const abierta = estaAbierta(oc)
                const atrasada = abierta && dias !== null && dias < 0
                const href = `${ordenBasePath(oc.tipo)}/${oc.id}`
                const Icon = ESTADO_ICON[oc.estado]
                const mostrarPago = oc.estado !== 'borrador' && oc.estado !== 'cancelada'
                const pct = total > 0 ? Math.min(100, Math.round((pagadoDe(oc) / total) * 100)) : 0

                let entregaTexto: string | null = null
                if (abierta && dias !== null) {
                  entregaTexto =
                    dias < 0 ? `Atrasada ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`
                    : dias === 0 ? 'Hoy'
                    : dias === 1 ? 'Mañana'
                    : dias <= 7 ? `En ${dias} días`
                    : null
                }

                return (
                  <tr
                    key={oc.id}
                    onClick={() => router.push(href)}
                    className="cursor-pointer transition-colors duration-[120ms] hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="block font-mono font-medium tabular-nums">{oc.numero}</span>
                        {oc.nombre && <span className="block max-w-56 truncate text-xs text-muted-foreground">{oc.nombre}</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block max-w-72 truncate font-medium">
                        {oc.proveedor?.razonSocial ?? oc.proveedorNombreLibre ?? 'Sin proveedor'}
                      </span>
                      <Link
                        href={`/proyectos/${oc.proyectoId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block max-w-72 truncate rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {oc.proyecto.nombre}
                        <span className="font-mono tabular-nums"> · {oc.proyecto.codigo ?? 'Sin código'}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      {oc.fechaEntrega ? (
                        <>
                          <span className={cn('block', atrasada ? 'font-medium text-destructive' : entregaTexto ? 'font-medium' : 'text-foreground')}>
                            {entregaTexto ?? formatFecha(oc.fechaEntrega)}
                          </span>
                          {entregaTexto && <span className="block text-xs tabular-nums text-muted-foreground">{formatFecha(oc.fechaEntrega)}</span>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sin fecha</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <span className="block font-medium tabular-nums">{formatCurrency(total)}</span>
                      {mostrarPago && (
                        <span className="mt-1 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                          <span
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Pagado"
                            className="h-1 w-12 overflow-hidden rounded-full bg-muted"
                          >
                            <span className="block h-full rounded-full bg-chart-2" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="tabular-nums">{pct === 0 ? 'Sin pagar' : pct === 100 ? 'Pagada' : `${pct} % pagado`}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[oc.estado])}>
                        <Icon className="size-3" aria-hidden="true" />
                        {ESTADO_LABEL[oc.estado]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sorted.length > visible && (
            <div className="border-t border-border p-2 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-lg px-3 py-1.5 text-sm text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring"
              >
                Mostrar más ({sorted.length - visible} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
