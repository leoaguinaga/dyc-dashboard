'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Building2,
  ExternalLink,
  X,
  Smartphone,
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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { API_ORIGIN } from '@/lib/api/client'
import type { Pago, Proyecto } from '@/types/api'
import {
  fmtMoney,
  fmtFechaCorta,
  getDestinoPago,
  getBeneficiario,
  getUrgencia,
  type InfoDestinoPago,
} from '@/lib/pagos-utils'
import { MarcarPagadoDrawer } from './MarcarPagadoDrawer'
import { ReporteButton } from './ReporteButton'

export { getDestinoPago, type InfoDestinoPago }

type UrgenciaFilter = 'todos' | 'vencidos' | 'hoy' | 'semana' | 'mes'
type SortField = 'urgencia' | 'monto_desc' | 'monto_asc' | 'beneficiario' | 'proyecto'

interface Props {
  pagos: Pago[]
  proyectos: Proyecto[]
  tipo?: 'pendientes' | 'pagados'
  fechaReporte?: string
  puedePagar?: boolean
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
  const [urgenciaFilter, setUrgenciaFilter] = useState<UrgenciaFilter>('todos')
  const [bancoFilter, setBancoFilter] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<SortField>('urgencia')

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

  // Filtrado
  const filtered = useMemo(() => {
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

    // Filtro por urgencia
    if (urgenciaFilter !== 'todos') {
      result = result.filter((p) => {
        const u = getUrgencia(p.fechaProgramada)
        if (urgenciaFilter === 'vencidos') return u.tipo === 'vencido'
        if (urgenciaFilter === 'hoy') return u.tipo === 'hoy'
        if (urgenciaFilter === 'semana') return u.tipo === 'vencido' || u.tipo === 'hoy' || u.tipo === 'manana' || u.tipo === 'semana'
        if (urgenciaFilter === 'mes') return u.dias <= 30
        return true
      })
    }

    // Filtro por banco o billetera
    if (bancoFilter !== 'todos') {
      result = result.filter((p) => {
        const { bancoNorm, billetera } = getDestinoPago(p)
        return bancoNorm === bancoFilter || billetera === bancoFilter.toLowerCase()
      })
    }

    // Buscador
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => {
        const benef = getBeneficiario(p).toLowerCase()
        const concepto = (p.concepto ?? p.ordenCompra?.concepto ?? '').toLowerCase()
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

    // Ordenamiento
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
  }, [pagos, proyectoId, urgenciaFilter, bancoFilter, search, sortBy])

  // Total de los pagos filtrados
  const totalFiltrado = useMemo(
    () => filtered.reduce((s, p) => s + Number(p.monto), 0),
    [filtered],
  )

  // Total de los pagos seleccionados
  const seleccionadosList = useMemo(
    () => pagos.filter((p) => selectedIds.has(p.id)),
    [pagos, selectedIds],
  )
  const totalSeleccionado = useMemo(
    () => seleccionadosList.reduce((s, p) => s + Number(p.monto), 0),
    [seleccionadosList],
  )

  // Manejadores de selección
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
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
      const concepto = p.concepto ?? p.ordenCompra?.concepto ?? 'Pago'

      lineas.push(`${idx + 1}. ${benef} — ${fmtMoney(Number(p.monto))}`)
      lineas.push(`   Concepto: ${concepto}`)
      lineas.push(`   Destino: ${destinoTxt}`)
      lineas.push('')
    })

    await navigator.clipboard.writeText(lineas.join('\n'))
    setCopiadoLote(true)
    setTimeout(() => setCopiadoLote(false), 2000)
  }

  const abrirPagar = (p: Pago) => {
    setPagoSeleccionado(p)
    setDrawerOpen(true)
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
    setUrgenciaFilter('todos')
    setBancoFilter('todos')
    setSortBy('urgencia')
  }

  const filtrosActivosConteo =
    (proyectoId !== 'todos' ? 1 : 0) +
    (urgenciaFilter !== 'todos' ? 1 : 0) +
    (bancoFilter !== 'todos' ? 1 : 0) +
    (sortBy !== 'urgencia' ? 1 : 0)

  return (
    <div className="space-y-3">
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

            {/* 2. Urgencia / Vencimiento */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground block">
                Vencimiento
              </label>
              <Select value={urgenciaFilter} onValueChange={(v) => setUrgenciaFilter((v ?? 'todos') as UrgenciaFilter)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Todas las fechas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las fechas</SelectItem>
                  <SelectItem value="vencidos">Solo vencidos</SelectItem>
                  <SelectItem value="hoy">Vencen hoy</SelectItem>
                  <SelectItem value="semana">Próximos 7 días</SelectItem>
                  <SelectItem value="mes">Próximos 30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Destino (Banco o Billetera) */}
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

            {/* 4. Ordenamiento */}
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
            label="Descargar reporte"
          />
        )}

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

          {urgenciaFilter !== 'todos' && (
            <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
              <span>
                Urgencia:{' '}
                {urgenciaFilter === 'vencidos'
                  ? 'Vencidos'
                  : urgenciaFilter === 'hoy'
                    ? 'Vencen hoy'
                    : urgenciaFilter === 'semana'
                      ? 'Próximos 7d'
                      : 'Próximos 30d'}
              </span>
              <button
                type="button"
                onClick={() => setUrgenciaFilter('todos')}
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

      {/* Resumen de conteo y montos filtrados */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando <strong>{filtered.length}</strong> de <strong>{pagos.length}</strong> pagos pendientes
        </span>
        <span>
          Total pendiente:{' '}
          <strong className="text-foreground font-semibold tabular-nums">{fmtMoney(totalFiltrado)}</strong>
        </span>
      </div>

      {/* Contenedor Principal de la Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            {search.trim() || proyectoId !== 'todos' || urgenciaFilter !== 'todos' || bancoFilter !== 'todos'
              ? 'No hay pagos que coincidan con los filtros aplicados'
              : 'No hay pagos pendientes'}
          </p>
          {(search || filtrosActivosConteo > 0) && (
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
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 min-w-[130px]">Vencimiento</th>
                  <th className="px-3 py-3 min-w-[200px]">Concepto / Detalle</th>
                  <th className="px-3 py-3 min-w-[240px]">Beneficiario y Destino</th>
                  <th className="px-3 py-3 min-w-[140px]">Centro de Costo</th>
                  <th className="px-3 py-3 text-center w-24">Sustento</th>
                  <th className="px-3 py-3 text-right min-w-[120px]">Monto</th>
                  <th className="px-3 py-3 text-right min-w-[100px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => renderFilaPago(p))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barra Flotante de Selección para Tesorería */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-foreground text-background px-4 py-2.5 shadow-xl text-xs animate-in fade-in-0 slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[11px]">
              {selectedIds.size}
            </span>
            <span className="font-medium">
              {selectedIds.size === 1 ? 'pago seleccionado' : 'pagos seleccionados'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold text-sm tabular-nums text-primary-foreground">
              Total: {fmtMoney(totalSeleccionado)}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={copiarLoteSeleccionado}
              className="h-7 text-xs gap-1.5 font-medium"
            >
              {copiadoLote ? (
                <>
                  <Check className="size-3.5 text-chart-2" />
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
              title="Deseleccionar todo"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-background hover:bg-background/20 transition-colors"
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

  function renderFilaPago(p: Pago) {
    const isSelected = selectedIds.has(p.id)
    const urg = getUrgencia(p.fechaProgramada)
    const benef = getBeneficiario(p)
    const destino = getDestinoPago(p)
    const proyecto = p.proyecto ?? p.ordenCompra?.proyecto

    // Limpieza de etiqueta de origen
    const ocNumRaw = p.ordenCompra?.numero ?? ''
    const ocNumClean = ocNumRaw.toUpperCase().startsWith('OC') || ocNumRaw.toUpperCase().startsWith('OS')
      ? ocNumRaw
      : `OC ${ocNumRaw}`

    const esCompraSimple =
      p.ordenCompra?.destinoPago === 'trabajador' ||
      (p.concepto && p.concepto.toLowerCase().includes('compra simple'))

    const origenTag = p.ordenCompra ? (
      <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-700">
        {ocNumClean} {esCompraSimple ? '· Compra simple' : ''} {p.porcentaje ? `(${p.porcentaje}%)` : ''}
      </span>
    ) : p.origen === 'recurrente' ? (
      <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/10 text-purple-700">
        Fijo
      </span>
    ) : p.origen === 'planilla_staff' ? (
      <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-700">
        Planilla
      </span>
    ) : (
      <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
        Manual
      </span>
    )

    return (
      <tr
        key={p.id}
        className={cn(
          'transition-colors duration-100 hover:bg-muted/30',
          isSelected ? 'bg-primary/5' : '',
        )}
      >
        {/* Checkbox */}
        <td className="px-3 py-3 text-center">
          <input
            type="checkbox"
            aria-label={`Seleccionar pago ${p.id}`}
            checked={isSelected}
            onChange={() => toggleSelectOne(p.id)}
            className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
          />
        </td>

        {/* Vencimiento */}
        <td className="px-3 py-3">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground text-xs">
              {fmtFechaCorta(p.fechaProgramada)}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[11px] border',
                urg.badgeClass,
              )}
            >
              {urg.tipo === 'vencido' && <AlertTriangle className="size-3 shrink-0" />}
              {urg.label}
            </span>
          </div>
        </td>

        {/* Concepto y Origen */}
        <td className="px-3 py-3">
          <div className="space-y-1">
            <Link
              href={`/pagos/${p.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight"
            >
              {p.concepto ?? p.ordenCompra?.concepto ?? 'Pago'}
            </Link>
            <div className="flex items-center gap-1.5">{origenTag}</div>
          </div>
        </td>

        {/* Beneficiario y Destino de Pago (Banco, Yape, Plin) */}
        <td className="px-3 py-3">
          <div className="space-y-1">
            <p className="font-medium text-foreground truncate max-w-[240px]" title={benef}>
              {benef}
            </p>

            {destino.esBilletera ? (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold tracking-wide text-[10px]',
                    destino.billetera === 'yape'
                      ? 'bg-[#732282]/15 text-[#732282]'
                      : 'bg-[#00d1d2]/20 text-[#008283]',
                  )}
                >
                  {destino.metodoLabel}
                </span>
                {destino.numero ? (
                  <button
                    type="button"
                    onClick={() => copiarTexto(destino.numero!, `${p.id}-cel`)}
                    className="group inline-flex items-center gap-1 hover:text-foreground transition-colors font-semibold text-foreground"
                    title={`Copiar número de ${destino.metodoLabel}`}
                  >
                    <span>Cel: {destino.numero}</span>
                    {copiadoKey === `${p.id}-cel` ? (
                      <Check className="size-3 text-chart-2" />
                    ) : (
                      <Copy className="size-3 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 italic">Sin celular</span>
                )}
              </div>
            ) : (destino.banco || destino.numero || destino.cci) ? (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                {destino.bancoNorm && destino.bancoNorm !== 'Sin banco' && (
                  <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground text-[10px]">
                    {destino.bancoNorm}
                  </span>
                )}
                {destino.numero && (
                  <button
                    type="button"
                    onClick={() => copiarTexto(destino.numero!, `${p.id}-num`)}
                    className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    title={`Copiar ${destino.numeroLabel}`}
                  >
                    <span>{destino.numeroLabel}: {destino.numero}</span>
                    {copiadoKey === `${p.id}-num` ? (
                      <Check className="size-3 text-chart-2" />
                    ) : (
                      <Copy className="size-3 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                )}
                {destino.cci && (!destino.numero || destino.numeroLabel === 'Cel') && (
                  <button
                    type="button"
                    onClick={() => copiarTexto(destino.cci!, `${p.id}-cci`)}
                    className="group inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    title="Copiar CCI"
                  >
                    <span>CCI: {destino.cci}</span>
                    {copiadoKey === `${p.id}-cci` ? (
                      <Check className="size-3 text-chart-2" />
                    ) : (
                      <Copy className="size-3 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 italic">Sin cuenta o billetera</span>
            )}
          </div>
        </td>

        {/* Centro de Costo */}
        <td className="px-3 py-3">
          {proyecto ? (
            <Link
              href={`/proyectos/${proyecto.id}`}
              className="block min-w-0 hover:text-primary transition-colors text-xs"
            >
              <span className="block font-medium text-foreground truncate max-w-[180px]">
                {proyecto.nombre ?? proyecto.codigo}
              </span>
              {proyecto.nombre && (
                <span className="block text-[11px] text-muted-foreground truncate max-w-[180px]">
                  {proyecto.codigo}
                </span>
              )}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="size-3" />
              Administración
            </span>
          )}
        </td>

        {/* Sustento / Factura */}
        <td className="px-3 py-3 text-center">
          {p.comprobanteUrl ? (
            <a
              href={`${API_ORIGIN}${p.comprobanteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/80 transition-colors"
              title={p.comprobanteNombre ?? 'Ver comprobante'}
            >
              <FileText className="size-3.5 text-primary" />
              <span>{p.comprobanteUrl.endsWith('.pdf') ? 'PDF' : 'Foto'}</span>
            </a>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">—</span>
          )}
        </td>

        {/* Monto */}
        <td className="px-3 py-3 text-right">
          <span className="font-semibold text-foreground tabular-nums text-sm">
            {fmtMoney(Number(p.monto))}
          </span>
        </td>

        {/* Acciones */}
        <td className="px-3 py-3 text-right">
          {puedePagar && (
            <div className="flex items-center justify-end gap-1">
              <Link href={`/pagos/${p.id}`}>
                <Button>Pagar</Button>
              </Link>
            </div>
          )}
        </td>
      </tr>
    )
  }
}
