'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Copy,
  Check,
  AlertCircle,
  Paperclip,
  Building2,
  ChevronDown,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { API_ORIGIN } from '@/lib/api/client'
import type { Pago, Proyecto } from '@/types/api'
import {
  fmtMoney,
  getDestinoPago,
  getBeneficiario,
  getConcepto,
  getUrgencia,
  type InfoDestinoPago,
} from '@/lib/pagos-utils'
import { MarcarPagadoDrawer } from './MarcarPagadoDrawer'
import { ReporteButton } from './ReporteButton'

export { getDestinoPago, type InfoDestinoPago }

type Banda = 'todos' | 'mas30' | 'vencidos' | 'proximos'
type Agrupar = 'edad' | 'benef' | 'obra'
type SortField = 'urgencia' | 'monto_desc' | 'monto_asc' | 'beneficiario' | 'proyecto'

interface Props {
  pagos: Pago[]
  proyectos: Proyecto[]
  tipo?: 'pendientes' | 'pagados'
  fechaReporte?: string
  puedePagar?: boolean
}

interface GrupoFilas {
  key: string
  label: string
  dot?: string
  pagos: Pago[]
}

const BANDAS: { key: Exclude<Banda, 'todos'>; label: string; corto: string; dot: string }[] = [
  { key: 'mas30', label: 'Vencidos hace más de 30 días', corto: 'Más de 30 días', dot: 'bg-destructive' },
  { key: 'vencidos', label: 'Vencidos hace 1 a 30 días', corto: 'De 1 a 30 días', dot: 'bg-amber-500' },
  { key: 'proximos', label: 'Vencen hoy o más adelante', corto: 'Hoy y próximos', dot: 'bg-muted-foreground/40' },
]

function bandaDe(p: Pago): Exclude<Banda, 'todos'> {
  const u = getUrgencia(p.fechaProgramada)
  if (u.tipo !== 'vencido') return 'proximos'
  return u.dias > 30 ? 'mas30' : 'vencidos'
}

function proyectoDe(p: Pago) {
  return p.proyecto ?? p.ordenCompra?.proyecto ?? null
}

function tieneDestino(p: Pago) {
  const d = getDestinoPago(p)
  return d.esBilletera ? !!d.numero : !!(d.banco || d.numero || d.cci)
}

function sumar(pagos: Pago[]) {
  return pagos.reduce((s, p) => s + Number(p.monto), 0)
}

function fmtFechaVence(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
  })
}

function textoRelativo(fechaProgramada: string) {
  const u = getUrgencia(fechaProgramada)
  if (u.tipo === 'vencido') return u.dias === 1 ? 'ayer' : `hace ${u.dias} d`
  if (u.tipo === 'hoy') return 'hoy'
  if (u.tipo === 'manana') return 'mañana'
  return `en ${u.dias} d`
}

export function PagosTableClient({
  pagos: pagosIniciales,
  proyectos,
  tipo = 'pendientes',
  fechaReporte,
  puedePagar = false,
}: Props) {
  const [pagos, setPagos] = useState<Pago[]>(pagosIniciales)
  const [search, setSearch] = useState('')
  const [proyectoId, setProyectoId] = useState<string>('todos')
  const [banda, setBanda] = useState<Banda>('todos')
  const [bancoFilter, setBancoFilter] = useState<string>('todos')
  const [sinCuenta, setSinCuenta] = useState(false)
  const [sortBy, setSortBy] = useState<SortField>('urgencia')
  const [agrupar, setAgrupar] = useState<Agrupar>('edad')
  const [cerrados, setCerrados] = useState<Set<string>>(new Set())

  // Selección múltiple para tesorería
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiadoKey, setCopiadoKey] = useState<string | null>(null)
  const [copiadoLote, setCopiadoLote] = useState(false)

  // Drawer de pago rápido
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Lista de bancos y billeteras presentes en los datos
  const bancosDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const p of pagos) {
      const { bancoNorm } = getDestinoPago(p)
      if (bancoNorm && bancoNorm !== 'Sin banco') {
        set.add(bancoNorm)
      }
    }
    return [...set].sort((a, b) => {
      // Priorizar Yape y Plin arriba para fácil selección
      if (a === 'Yape') return -1
      if (b === 'Yape') return 1
      if (a === 'Plin') return -1
      if (b === 'Plin') return 1
      return a.localeCompare(b)
    })
  }, [pagos])

  // Filtrado sin la banda de antigüedad: alimenta las tarjetas-resumen
  const baseFiltrada = useMemo(() => {
    let result = pagos

    // Filtro por proyecto
    if (proyectoId !== 'todos') {
      result = result.filter((p) => {
        const pId = p.proyecto?.id ?? p.ordenCompra?.proyecto?.id
        if (proyectoId === 'administracion') {
          return !pId || p.centroCosto === 'administracion'
        }
        return pId === proyectoId
      })
    }

    // Filtro por banco o billetera
    if (bancoFilter !== 'todos') {
      result = result.filter((p) => {
        const { bancoNorm, billetera } = getDestinoPago(p)
        return bancoNorm === bancoFilter || billetera === bancoFilter.toLowerCase()
      })
    }

    // Pagos a los que les falta cuenta o billetera
    if (sinCuenta) {
      result = result.filter((p) => !tieneDestino(p))
    }

    // Buscador
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => {
        const benef = getBeneficiario(p).toLowerCase()
        const concepto = getConcepto(p).toLowerCase()
        const ocNum = (p.ordenCompra?.numero ?? '').toLowerCase()
        const proyNom = (p.proyecto?.nombre ?? p.ordenCompra?.proyecto?.nombre ?? '').toLowerCase()
        const proyCod = (p.proyecto?.codigo ?? p.ordenCompra?.proyecto?.codigo ?? '').toLowerCase()
        const destino = getDestinoPago(p)
        const b = (destino.bancoNorm ?? '').toLowerCase()
        const num = (destino.numero ?? '').toLowerCase()
        const cci = (destino.cci ?? '').toLowerCase()
        const met = destino.metodoLabel.toLowerCase()

        return (
          benef.includes(q) ||
          concepto.includes(q) ||
          ocNum.includes(q) ||
          proyNom.includes(q) ||
          proyCod.includes(q) ||
          b.includes(q) ||
          num.includes(q) ||
          cci.includes(q) ||
          met.includes(q) ||
          (destino.billetera && destino.billetera.includes(q))
        )
      })
    }

    return result
  }, [pagos, proyectoId, bancoFilter, sinCuenta, search])

  // Filtrado final + ordenamiento
  const filtered = useMemo(() => {
    const result = banda === 'todos' ? baseFiltrada : baseFiltrada.filter((p) => bandaDe(p) === banda)

    return [...result].sort((a, b) => {
      if (sortBy === 'monto_desc') return Number(b.monto) - Number(a.monto)
      if (sortBy === 'monto_asc') return Number(a.monto) - Number(b.monto)
      if (sortBy === 'beneficiario') {
        return getBeneficiario(a).localeCompare(getBeneficiario(b))
      }
      if (sortBy === 'proyecto') {
        const nomA = a.proyecto?.nombre ?? a.ordenCompra?.proyecto?.nombre ?? 'Administración'
        const nomB = b.proyecto?.nombre ?? b.ordenCompra?.proyecto?.nombre ?? 'Administración'
        return nomA.localeCompare(nomB)
      }
      // 'urgencia' (por fecha programada ascendente: vencidos primero)
      return a.fechaProgramada.localeCompare(b.fechaProgramada)
    })
  }, [baseFiltrada, banda, sortBy])

  // Resumen por banda de antigüedad (sobre la base filtrada)
  const resumenBandas = useMemo(() => {
    const out: Record<Banda, { total: number; count: number }> = {
      todos: { total: sumar(baseFiltrada), count: baseFiltrada.length },
      mas30: { total: 0, count: 0 },
      vencidos: { total: 0, count: 0 },
      proximos: { total: 0, count: 0 },
    }
    for (const p of baseFiltrada) {
      const b = bandaDe(p)
      out[b].total += Number(p.monto)
      out[b].count += 1
    }
    return out
  }, [baseFiltrada])

  const sinCuentaCount = useMemo(() => pagos.filter((p) => !tieneDestino(p)).length, [pagos])

  // Grupos de la lista (respetan el orden ya aplicado a `filtered`)
  const grupos = useMemo<GrupoFilas[]>(() => {
    const map = new Map<string, GrupoFilas>()
    const push = (key: string, label: string, dot: string | undefined, p: Pago) => {
      if (!map.has(key)) map.set(key, { key, label, dot, pagos: [] })
      map.get(key)!.pagos.push(p)
    }
    for (const p of filtered) {
      if (agrupar === 'edad') {
        const b = BANDAS.find((x) => x.key === bandaDe(p))!
        push(b.key, b.label, b.dot, p)
      } else if (agrupar === 'benef') {
        const nombre = getBeneficiario(p)
        push(nombre, nombre, undefined, p)
      } else {
        const proy = proyectoDe(p)
        push(
          proy?.id ?? 'administracion',
          proy ? (proy.nombre ?? proy.codigo ?? 'Proyecto') : 'Administración / Oficina',
          undefined,
          p,
        )
      }
    }
    const arr = [...map.values()]
    if (agrupar === 'edad') {
      return arr.sort(
        (a, b) => BANDAS.findIndex((x) => x.key === a.key) - BANDAS.findIndex((x) => x.key === b.key),
      )
    }
    return arr.sort((a, b) => sumar(b.pagos) - sumar(a.pagos))
  }, [filtered, agrupar])

  // Total de los pagos seleccionados
  const seleccionadosList = useMemo(
    () => pagos.filter((p) => selectedIds.has(p.id)),
    [pagos, selectedIds],
  )
  const totalSeleccionado = useMemo(() => sumar(seleccionadosList), [seleccionadosList])
  const seleccionadosSinCuenta = useMemo(
    () => seleccionadosList.filter((p) => !tieneDestino(p)).length,
    [seleccionadosList],
  )

  // Manejadores de selección
  const toggleSelectAll = () => {
    if (filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectGrupo = (g: GrupoFilas) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const todos = g.pagos.every((p) => next.has(p.id))
      for (const p of g.pagos) {
        if (todos) next.delete(p.id)
        else next.add(p.id)
      }
      return next
    })
  }

  const toggleGrupo = (key: string) => {
    setCerrados((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Copiar dato bancario individual
  const copiarTexto = async (texto: string, key: string) => {
    await navigator.clipboard.writeText(texto)
    setCopiadoKey(key)
    setTimeout(() => setCopiadoKey(null), 1800)
  }

  // Copiar resumen del lote seleccionado
  const copiarLoteSeleccionado = async () => {
    if (seleccionadosList.length === 0) return

    const lineas = [
      `=== PROGRAMACIÓN DE PAGOS (${seleccionadosList.length} ítems) ===`,
      `Total: ${fmtMoney(totalSeleccionado)}`,
      '',
    ]

    seleccionadosList.forEach((p, idx) => {
      const benef = getBeneficiario(p)
      const destino = getDestinoPago(p)
      let destinoTxt = 'Sin cuenta o billetera registrada'
      if (destino.esBilletera) {
        destinoTxt = `[${destino.metodoLabel}] Cel: ${destino.numero || 'Sin número'}`
      } else if (destino.banco || destino.numero || destino.cci) {
        const bTxt = destino.banco ? `[${destino.banco}]` : ''
        const nTxt = destino.numero ? `${destino.numeroLabel}: ${destino.numero}` : ''
        const cTxt = destino.cci ? `CCI: ${destino.cci}` : ''
        destinoTxt = [bTxt, nTxt, cTxt].filter(Boolean).join(' ')
      }
      const concepto = getConcepto(p)

      lineas.push(`${idx + 1}. ${benef} — ${fmtMoney(Number(p.monto))}`)
      lineas.push(`   Concepto: ${concepto}`)
      lineas.push(`   Destino: ${destinoTxt}`)
      lineas.push('')
    })

    await navigator.clipboard.writeText(lineas.join('\n'))
    setCopiadoLote(true)
    setTimeout(() => setCopiadoLote(false), 2000)
  }

  const handlePagoCompletado = (pagoId: string) => {
    setPagos((prev) => prev.filter((p) => p.id !== pagoId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(pagoId)
      return next
    })
  }

  const resetFiltros = () => {
    setProyectoId('todos')
    setBancoFilter('todos')
    setSinCuenta(false)
    setBanda('todos')
    setSortBy('urgencia')
  }

  // Los filtros del popover (proyecto, destino, orden)
  const filtrosActivosConteo =
    (proyectoId !== 'todos' ? 1 : 0) +
    (bancoFilter !== 'todos' ? 1 : 0) +
    (sortBy !== 'urgencia' ? 1 : 0)

  const hayFiltros = filtrosActivosConteo > 0 || sinCuenta || banda !== 'todos' || !!search.trim()
  const todosSeleccionados = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))
  const algunoSeleccionado = filtered.some((p) => selectedIds.has(p.id))

  return (
    <div className="space-y-4">
      {/* Resumen por antigüedad: también filtra la lista */}
      <div
        role="group"
        aria-label="Filtrar por antigüedad"
        className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-white md:grid-cols-4"
      >
        {(
          [
            { key: 'todos' as const, label: 'Todos', dot: '' },
            ...BANDAS.map((b) => ({ key: b.key, label: b.corto, dot: b.dot })),
          ]
        ).map((b, i) => {
          const r = resumenBandas[b.key]
          const activo = banda === b.key
          return (
            <button
              key={b.key}
              type="button"
              aria-pressed={activo}
              onClick={() => setBanda(b.key)}
              className={cn(
                'flex flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors duration-[120ms] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                i > 0 && 'md:border-l md:border-border',
                i > 1 && 'border-t border-border md:border-t-0',
                i === 1 && 'border-l border-border',
                i === 3 && 'border-l border-border',
                activo ? 'bg-primary/5' : 'hover:bg-muted/40',
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-2 text-xs font-medium',
                  activo ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {b.dot && <span className={cn('size-2 rounded-full', b.dot)} aria-hidden />}
                {b.label}
              </span>
              <span className="text-xl font-semibold tabular-nums tracking-tight">
                {fmtMoney(r.total)}
              </span>
              <span className="text-xs text-muted-foreground">
                {r.count} {r.count === 1 ? 'pago' : 'pagos'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Buscador */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Buscar pagos pendientes"
            placeholder="Buscar por proveedor, trabajador, N° OC, Yape, Plin o cuenta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>

        {/* Pagos a los que les falta la cuenta */}
        <button
          type="button"
          aria-pressed={sinCuenta}
          onClick={() => setSinCuenta((v) => !v)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors duration-[120ms] cursor-pointer',
            sinCuenta
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-800'
              : 'border-border bg-white hover:bg-muted/40',
          )}
        >
          <AlertCircle className="size-3.5" />
          <span>Sin cuenta</span>
          <span className="tabular-nums text-xs text-muted-foreground">{sinCuentaCount}</span>
        </button>

        {/* Dropdown Unificado "Filtros" */}
        <Popover>
          <PopoverTrigger
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm transition-colors cursor-pointer',
              filtrosActivosConteo > 0
                ? 'border-primary/40 bg-primary/5 text-primary'
                : 'border-border bg-white hover:text-foreground hover:bg-muted/40',
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filtros</span>
            {filtrosActivosConteo > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {filtrosActivosConteo}
              </span>
            )}
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-4 shadow-lg border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Filtros
                </span>
                {filtrosActivosConteo > 0 && (
                  <span className="text-xs text-muted-foreground">({filtrosActivosConteo})</span>
                )}
              </div>
              {filtrosActivosConteo > 0 && (
                <button
                  type="button"
                  onClick={resetFiltros}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors hover:underline"
                >
                  Restablecer
                </button>
              )}
            </div>

            {/* 1. Centro de Costo */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground block">
                Centro de costo
              </label>
              <Select value={proyectoId} onValueChange={(v) => setProyectoId(v ?? 'todos')}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <p>Centro de costo</p>
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="todos">Todos los centros</SelectItem>
                  <SelectItem value="administracion">Administración / Oficina</SelectItem>
                  {proyectos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} · ${p.nombre}` : p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Destino (Banco o Billetera) */}
            {bancosDisponibles.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Destino (Banco / Billetera)
                </label>
                <Select value={bancoFilter} onValueChange={(v) => setBancoFilter(v ?? 'todos')}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Todos los destinos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los destinos</SelectItem>
                    {bancosDisponibles.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 3. Ordenamiento dentro de cada grupo */}
            <div className="space-y-1 pt-2 border-t border-border">
              <label className="text-xs font-medium text-foreground block">
                Ordenar por
              </label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgencia">Más urgentes primero</SelectItem>
                  <SelectItem value="monto_desc">Mayor monto</SelectItem>
                  <SelectItem value="monto_asc">Menor monto</SelectItem>
                  <SelectItem value="beneficiario">Beneficiario A-Z</SelectItem>
                  <SelectItem value="proyecto">Centro de costo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {puedePagar && (
          <ReporteButton
            tipo={tipo}
            fecha={fechaReporte}
            label="Reporte"
          />
        )}

        {/* Agrupar por */}
        <div className="flex items-center gap-2 lg:ml-auto">
          <span className="text-xs text-muted-foreground">Agrupar</span>
          <div
            role="group"
            aria-label="Agrupar pagos por"
            className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
          >
            {(
              [
                ['edad', 'Antigüedad'],
                ['benef', 'Beneficiario'],
                ['obra', 'Obra'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={agrupar === k}
                onClick={() => {
                  setAgrupar(k)
                  setCerrados(new Set())
                }}
                className={cn(
                  'h-7 rounded-md px-2.5 text-xs font-medium transition-colors duration-[120ms] cursor-pointer',
                  agrupar === k
                    ? 'bg-white text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chips de Filtros Activos para fácil visualización y desmarcado */}
      {filtrosActivosConteo > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          <span className="text-[11px] text-muted-foreground mr-1">Filtros:</span>
          {proyectoId !== 'todos' && (
            <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
              <span>
                Centro:{' '}
                {proyectoId === 'administracion'
                  ? 'Administración'
                  : (proyectos.find((p) => p.id === proyectoId)?.codigo ?? 'Obra')}
              </span>
              <button
                type="button"
                onClick={() => setProyectoId('todos')}
                className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                title="Quitar filtro"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {bancoFilter !== 'todos' && (
            <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
              <span>Destino: {bancoFilter}</span>
              <button
                type="button"
                onClick={() => setBancoFilter('todos')}
                className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                title="Quitar filtro"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {sortBy !== 'urgencia' && (
            <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
              <span>
                Orden:{' '}
                {sortBy === 'monto_desc'
                  ? 'Mayor monto'
                  : sortBy === 'monto_asc'
                    ? 'Menor monto'
                    : sortBy === 'beneficiario'
                      ? 'Beneficiario'
                      : 'Centro de costo'}
              </span>
              <button
                type="button"
                onClick={() => setSortBy('urgencia')}
                className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                title="Quitar filtro"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={resetFiltros}
            className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors ml-1 cursor-pointer"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {/* Contenedor Principal de la Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            {hayFiltros
              ? 'No hay pagos que coincidan con los filtros aplicados'
              : 'No hay pagos pendientes'}
          </p>
          {hayFiltros && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                resetFiltros()
              }}
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm text-left">
              <thead className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={todosSeleccionados}
                      ref={(el) => {
                        if (el) el.indeterminate = algunoSeleccionado && !todosSeleccionados
                      }}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium min-w-[260px]">Beneficiario y concepto</th>
                  <th className="px-3 py-2.5 font-medium min-w-[150px]">Obra</th>
                  <th className="px-3 py-2.5 font-medium w-[96px]">Vence</th>
                  <th className="px-3 py-2.5 font-medium min-w-[220px]">Destino</th>
                  <th className="px-3 py-2.5 font-medium text-right min-w-[110px]">Monto</th>
                  <th className="px-3 py-2.5 w-[84px]">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => {
                  const abierto = !cerrados.has(g.key)
                  const seleccionadosGrupo = g.pagos.filter((p) => selectedIds.has(p.id)).length
                  const todoGrupo = seleccionadosGrupo === g.pagos.length
                  return (
                    <Fragment key={g.key}>
                      <tr className="border-y border-border bg-muted/40 first:border-t-0">
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar todo el grupo ${g.label}`}
                            checked={todoGrupo}
                            ref={(el) => {
                              if (el) el.indeterminate = seleccionadosGrupo > 0 && !todoGrupo
                            }}
                            onChange={() => toggleSelectGrupo(g)}
                            className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                          />
                        </td>
                        <td colSpan={4} className="px-3 py-1">
                          <button
                            type="button"
                            aria-expanded={abierto}
                            onClick={() => toggleGrupo(g.key)}
                            className="flex w-full items-center gap-2 rounded py-1 text-left text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronDown
                              className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-[180ms]',
                                !abierto && '-rotate-90',
                              )}
                            />
                            {g.dot && <span className={cn('size-2 shrink-0 rounded-full', g.dot)} aria-hidden />}
                            <span className="truncate">{g.label}</span>
                            <span className="shrink-0 text-xs font-normal text-muted-foreground">
                              {g.pagos.length} {g.pagos.length === 1 ? 'pago' : 'pagos'}
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                          {fmtMoney(sumar(g.pagos))}
                        </td>
                        <td />
                      </tr>
                      {abierto && g.pagos.map((p) => renderFilaPago(p))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barra Flotante de Selección para Tesorería */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-foreground text-background px-4 py-2.5 shadow-xl text-xs animate-in fade-in-0 slide-in-from-bottom-3 duration-150">
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-sm">
              {selectedIds.size} {selectedIds.size === 1 ? 'pago seleccionado' : 'pagos seleccionados'}
            </span>
            <span className="tabular-nums text-background/70">
              Total {fmtMoney(totalSeleccionado)}
              {seleccionadosSinCuenta > 0 && ` · ${seleccionadosSinCuenta} sin cuenta`}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" onClick={copiarLoteSeleccionado} className="h-7 text-xs gap-1.5 font-medium">
              {copiadoLote ? (
                <>
                  <Check className="size-3.5" />
                  Copiado al portapapeles
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copiar cuentas y montos
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              aria-label="Deseleccionar todo"
              title="Deseleccionar todo"
              className="flex size-6 items-center justify-center rounded text-background/70 hover:text-background hover:bg-background/20 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer para Marcar como Pagado */}
      <MarcarPagadoDrawer
        pago={pagoSeleccionado}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onPagoCompletado={handlePagoCompletado}
      />
    </div>
  )

  function botonCopiar(texto: string, key: string, label: string) {
    const ok = copiadoKey === key
    return (
      <button
        type="button"
        onClick={() => copiarTexto(texto, key)}
        aria-label={label}
        title={label}
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded transition-colors duration-[120ms] cursor-pointer',
          ok ? 'text-chart-2' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    )
  }

  function renderDestino(p: Pago, destino: InfoDestinoPago) {
    if (!tieneDestino(p)) {
      return (
        <Link
          href={`/pagos/${p.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 underline decoration-amber-700/40 underline-offset-4 hover:decoration-current"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          Falta cuenta
        </Link>
      )
    }

    if (destino.esBilletera) {
      return (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[11px] font-semibold',
              destino.billetera === 'yape'
                ? 'bg-[#732282]/15 text-[#732282]'
                : 'bg-[#00d1d2]/20 text-[#008283]',
            )}
          >
            {destino.metodoLabel}
          </span>
          <span className="font-mono text-[13px] tabular-nums">{destino.numero}</span>
          {botonCopiar(destino.numero!, `${p.id}-cel`, `Copiar número de ${destino.metodoLabel}`)}
        </div>
      )
    }

    const principal = destino.numero ?? destino.cci!
    const principalLabel = destino.numero ? destino.numeroLabel : 'CCI'
    return (
      <div className="flex items-center gap-1.5">
        {destino.bancoNorm && destino.bancoNorm !== 'Sin banco' && (
          <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {destino.bancoNorm}
          </span>
        )}
        <span className="truncate font-mono text-[13px] tabular-nums" title={principal}>
          {principal}
        </span>
        {botonCopiar(principal, `${p.id}-num`, `Copiar ${principalLabel}`)}
        {destino.numero && destino.cci && (
          <button
            type="button"
            onClick={() => copiarTexto(destino.cci!, `${p.id}-cci`)}
            title="Copiar CCI"
            aria-label="Copiar CCI"
            className={cn(
              'shrink-0 rounded px-1 text-[11px] font-medium transition-colors duration-[120ms] cursor-pointer',
              copiadoKey === `${p.id}-cci`
                ? 'text-chart-2'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {copiadoKey === `${p.id}-cci` ? 'Copiado' : 'CCI'}
          </button>
        )}
      </div>
    )
  }

  function renderFilaPago(p: Pago) {
    const isSelected = selectedIds.has(p.id)
    const benef = getBeneficiario(p)
    const destino = getDestinoPago(p)
    const proyecto = proyectoDe(p)

    const ocNumRaw = p.ordenCompra?.numero ?? ''
    const esCompraSimple =
      p.ordenCompra?.destinoPago === 'trabajador' ||
      (p.concepto && p.concepto.toLowerCase().includes('compra simple'))
    const parcial = p.porcentaje && Number(p.porcentaje) < 100 ? Number(p.porcentaje) : null

    const origen = p.ordenCompra
      ? ocNumRaw.toUpperCase().startsWith('OC') || ocNumRaw.toUpperCase().startsWith('OS')
        ? ocNumRaw
        : `OC ${ocNumRaw}`
      : p.origen === 'recurrente'
        ? 'Pago fijo'
        : p.origen === 'planilla_staff'
          ? 'Planilla'
          : 'Manual'

    const urg = getUrgencia(p.fechaProgramada)

    return (
      <tr
        key={p.id}
        data-selected={isSelected}
        className={cn(
          'border-b border-border last:border-b-0 transition-colors duration-[120ms] hover:bg-muted/30',
          isSelected && 'bg-primary/5 hover:bg-primary/5',
        )}
      >
        {/* Checkbox */}
        <td className="px-3 py-2 text-center">
          <input
            type="checkbox"
            aria-label={`Seleccionar pago a ${benef}`}
            checked={isSelected}
            onChange={() => toggleSelectOne(p.id)}
            className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
          />
        </td>

        {/* Beneficiario y concepto */}
        <td className="px-3 py-2">
          <div className="flex items-start gap-1.5">
            <div className="min-w-0 leading-snug">
              <Link
                href={`/pagos/${p.id}`}
                className="block max-w-[340px] truncate font-medium text-foreground hover:text-primary transition-colors"
                title={benef}
              >
                {benef}
              </Link>
              <p
                className="max-w-[340px] truncate text-[13px] text-muted-foreground"
                title={getConcepto(p)}
              >
                {getConcepto(p)}
                <span className="text-muted-foreground/60"> · </span>
                <span className="font-mono text-xs">{origen}</span>
                {esCompraSimple && ' · Compra simple'}
                {parcial !== null && (
                  <span className="font-medium text-amber-700"> · Parcial {parcial}%</span>
                )}
              </p>
            </div>
            {p.comprobanteUrl && (
              <a
                href={`${API_ORIGIN}${p.comprobanteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                title={p.comprobanteNombre ?? 'Ver comprobante'}
                aria-label="Ver comprobante"
              >
                <Paperclip className="size-3.5" />
              </a>
            )}
          </div>
        </td>

        {/* Obra */}
        <td className="px-3 py-2">
          {proyecto ? (
            <Link
              href={`/proyectos/${proyecto.id}`}
              className="block min-w-0 leading-snug hover:text-primary transition-colors"
            >
              <span className="block max-w-[190px] truncate font-medium text-foreground">
                {proyecto.nombre ?? proyecto.codigo}
              </span>
              {proyecto.nombre && (
                <span className="block font-mono text-xs text-muted-foreground">
                  {proyecto.codigo}
                </span>
              )}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="size-3.5" />
              Administración
            </span>
          )}
        </td>

        {/* Vence */}
        <td className="px-3 py-2">
          <div className="leading-snug">
            <span className="block font-mono text-[13px] tabular-nums">
              {fmtFechaVence(p.fechaProgramada)}
            </span>
            <span
              className={cn(
                'block text-xs',
                urg.tipo === 'hoy' ? 'font-medium text-amber-700' : 'text-muted-foreground',
              )}
            >
              {textoRelativo(p.fechaProgramada)}
            </span>
          </div>
        </td>

        {/* Destino */}
        <td className="px-3 py-2">{renderDestino(p, destino)}</td>

        {/* Monto */}
        <td className="px-3 py-2 text-right">
          <span className="font-mono text-sm font-medium tabular-nums">
            {fmtMoney(Number(p.monto))}
          </span>
        </td>

        {/* Acción */}
        <td className="px-3 py-2 text-right">
          {puedePagar && (
            <Link
              href={`/pagos/${p.id}`}
              aria-label={`Pagar a ${benef}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Pagar
            </Link>
          )}
        </td>
      </tr>
    )
  }
}
