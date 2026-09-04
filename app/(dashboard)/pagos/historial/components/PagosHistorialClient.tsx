'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  Copy,
  Check,
  FileText,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  LayoutList,
  Table as TableIcon,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import { ReporteButton } from '@/app/(dashboard)/pagos/components/ReporteButton'
import { cn, formatDateOnly } from '@/lib/utils'
import { API_ORIGIN } from '@/lib/api/client'
import {
  fmtMoney,
  fmtFechaCorta,
  getDestinoPago,
  getBeneficiario,
} from '@/lib/pagos-utils'
import type { Pago, Proyecto } from '@/types/api'
import { useSession } from '@/lib/auth/session'

type EstadoFiltro = 'todos' | 'pagado' | 'cancelado'
type RangoPreestablecido = '7d' | '30d' | 'mes_actual' | 'mes_anterior' | '90d' | 'todo' | 'personalizado'
type SortField = 'fecha_desc' | 'fecha_asc' | 'monto_desc' | 'monto_asc' | 'beneficiario' | 'proyecto'
type ModoVista = 'timeline' | 'tabla'

interface Props {
  pagos: Pago[]
  proyectos: Proyecto[]
}

function isoDeFecha(fecha?: string | null): string {
  if (!fecha) return ''
  return fecha.slice(0, 10)
}

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtFechaLarga(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function PagosHistorialClient({ pagos: todosLosPagos, proyectos }: Props) {
  const { data: session } = useSession()
  const puedeDescargarReporte = ['administrador', 'gerencia', 'admin_ti'].includes(session?.user?.role ?? '')
  // Historial considera principalmente los registros cerrados (pagado y cancelado)
  const pagosHistorialBase = useMemo(() => {
    return todosLosPagos.filter((p) => p.estado === 'pagado' || p.estado === 'cancelado')
  }, [todosLosPagos])

  // Estados de control
  const [modoVista, setModoVista] = useState<ModoVista>('timeline')
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('pagado')
  const [proyectoId, setProyectoId] = useState<string>('todos')
  const [bancoFilter, setBancoFilter] = useState<string>('todos')
  const [rangoPreestablecido, setRangoPreestablecido] = useState<RangoPreestablecido>('30d')
  const [rangoCustom, setRangoCustom] = useState<DateRangeValue>({})
  const [sortBy, setSortBy] = useState<SortField>('fecha_desc')

  // Selección múltiple para auditoría / tesorería
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiadoKey, setCopiadoKey] = useState<string | null>(null)
  const [copiadoLote, setCopiadoLote] = useState(false)

  // Lista de bancos y billeteras disponibles en los datos
  const bancosDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const p of pagosHistorialBase) {
      const { bancoNorm } = getDestinoPago(p)
      if (bancoNorm && bancoNorm !== 'Sin banco') {
        set.add(bancoNorm)
      }
    }
    return [...set].sort((a, b) => {
      if (a === 'Yape') return -1
      if (b === 'Yape') return 1
      if (a === 'Plin') return -1
      if (b === 'Plin') return 1
      return a.localeCompare(b)
    })
  }, [pagosHistorialBase])

  // Lógica de fechas según rango preestablecido
  const { fechaDesde, fechaHasta } = useMemo(() => {
    const hoy = new Date()
    const hoyStr = hoyISO()

    if (rangoPreestablecido === 'personalizado') {
      return {
        fechaDesde: rangoCustom.desde ?? '',
        fechaHasta: rangoCustom.hasta ?? '',
      }
    }

    if (rangoPreestablecido === 'todo') {
      return { fechaDesde: '', fechaHasta: '' }
    }

    if (rangoPreestablecido === '7d') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return { fechaDesde: isoDeFecha(d.toISOString()), fechaHasta: hoyStr }
    }

    if (rangoPreestablecido === '30d') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return { fechaDesde: isoDeFecha(d.toISOString()), fechaHasta: hoyStr }
    }

    if (rangoPreestablecido === '90d') {
      const d = new Date()
      d.setDate(d.getDate() - 90)
      return { fechaDesde: isoDeFecha(d.toISOString()), fechaHasta: hoyStr }
    }

    if (rangoPreestablecido === 'mes_actual') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return { fechaDesde: isoDeFecha(inicio.toISOString()), fechaHasta: hoyStr }
    }

    if (rangoPreestablecido === 'mes_anterior') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      return {
        fechaDesde: isoDeFecha(inicio.toISOString()),
        fechaHasta: isoDeFecha(fin.toISOString()),
      }
    }

    return { fechaDesde: '', fechaHasta: '' }
  }, [rangoPreestablecido, rangoCustom])

  // Filtrado de pagos
  const filtered = useMemo(() => {
    let result = pagosHistorialBase

    // 1. Filtro de estado
    if (estadoFiltro !== 'todos') {
      result = result.filter((p) => p.estado === estadoFiltro)
    }

    // 2. Filtro por fechas (toma fechaPagoReal para pagados, o fechaProgramada)
    if (fechaDesde || fechaHasta) {
      result = result.filter((p) => {
        const fechaComparar = isoDeFecha(p.fechaPagoReal ?? p.fechaProgramada)
        if (!fechaComparar) return false
        if (fechaDesde && fechaComparar < fechaDesde) return false
        if (fechaHasta && fechaComparar > fechaHasta) return false
        return true
      })
    }

    // 3. Filtro por proyecto / centro de costo
    if (proyectoId !== 'todos') {
      result = result.filter((p) => {
        const pId = p.proyecto?.id ?? p.ordenCompra?.proyecto?.id
        if (proyectoId === 'administracion') {
          return !pId || p.centroCosto === 'administracion'
        }
        return pId === proyectoId
      })
    }

    // 4. Filtro por banco o billetera
    if (bancoFilter !== 'todos') {
      result = result.filter((p) => {
        const { bancoNorm, billetera } = getDestinoPago(p)
        return bancoNorm === bancoFilter || billetera === bancoFilter.toLowerCase()
      })
    }

    // 5. Buscador de texto
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => {
        const benef = getBeneficiario(p).toLowerCase()
        const concepto = (p.concepto ?? p.ordenCompra?.concepto ?? '').toLowerCase()
        const ocNum = (p.ordenCompra?.numero ?? '').toLowerCase()
        const proyNom = (p.proyecto?.nombre ?? p.ordenCompra?.proyecto?.nombre ?? '').toLowerCase()
        const proyCod = (p.proyecto?.codigo ?? p.ordenCompra?.proyecto?.codigo ?? '').toLowerCase()
        const opNum = (p.numeroOperacion ?? '').toLowerCase()
        const nota = (p.nota ?? '').toLowerCase()
        const destino = getDestinoPago(p)
        const b = (destino.bancoNorm ?? '').toLowerCase()
        const num = (destino.numero ?? '').toLowerCase()
        const cci = (destino.cci ?? '').toLowerCase()
        const met = destino.metodoLabel.toLowerCase()
        const pagador = (p.pagadoPor?.name ?? '').toLowerCase()

        return (
          benef.includes(q) ||
          concepto.includes(q) ||
          ocNum.includes(q) ||
          opNum.includes(q) ||
          proyNom.includes(q) ||
          proyCod.includes(q) ||
          nota.includes(q) ||
          b.includes(q) ||
          num.includes(q) ||
          cci.includes(q) ||
          met.includes(q) ||
          pagador.includes(q) ||
          (destino.billetera && destino.billetera.includes(q))
        )
      })
    }

    // 6. Ordenamiento
    return [...result].sort((a, b) => {
      const fechaA = a.fechaPagoReal ?? a.fechaProgramada
      const fechaB = b.fechaPagoReal ?? b.fechaProgramada

      if (sortBy === 'fecha_desc') return fechaB.localeCompare(fechaA)
      if (sortBy === 'fecha_asc') return fechaA.localeCompare(fechaB)
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
      return fechaB.localeCompare(fechaA)
    })
  }, [
    pagosHistorialBase,
    estadoFiltro,
    fechaDesde,
    fechaHasta,
    proyectoId,
    bancoFilter,
    search,
    sortBy,
  ])

  // KPIs dinámicos calculados a partir de los datos filtrados
  const kpis = useMemo(() => {
    let totalDesembolsado = 0
    let totalCancelado = 0
    let pagadosCount = 0
    let canceladosCount = 0
    const beneficiariosSet = new Set<string>()

    for (const p of filtered) {
      const monto = Number(p.monto)
      if (p.estado === 'pagado') {
        totalDesembolsado += monto
        pagadosCount++
        beneficiariosSet.add(getBeneficiario(p))
      } else if (p.estado === 'cancelado') {
        totalCancelado += monto
        canceladosCount++
      }
    }

    return {
      totalDesembolsado,
      totalCancelado,
      pagadosCount,
      canceladosCount,
      beneficiariosCount: beneficiariosSet.size,
    }
  }, [filtered])

  // Agrupamiento por fecha para la vista timeline
  const gruposPorFecha = useMemo(() => {
    const map = new Map<string, Pago[]>()
    for (const p of filtered) {
      const f = isoDeFecha(p.fechaPagoReal ?? p.fechaProgramada) || 'Sin fecha'
      if (!map.has(f)) map.set(f, [])
      map.get(f)!.push(p)
    }

    const entries = [...map.entries()]
    if (sortBy === 'fecha_asc') {
      entries.sort((a, b) => (a[0] > b[0] ? 1 : -1))
    } else {
      entries.sort((a, b) => (a[0] < b[0] ? 1 : -1))
    }

    return entries.map(([fecha, items]) => {
      const proyMap = new Map<
        string,
        { proyecto: Pick<Proyecto, 'id' | 'codigo' | 'nombre'>; pagos: Pago[] }
      >()
      for (const p of items) {
        const proyecto = p.proyecto ??
          p.ordenCompra?.proyecto ?? {
            id: 'administracion',
            codigo: 'ADM',
            nombre: 'Administración / Oficina',
          }
        if (!proyMap.has(proyecto.id)) {
          proyMap.set(proyecto.id, { proyecto, pagos: [] })
        }
        proyMap.get(proyecto.id)!.pagos.push(p)
      }

      const totalDia = items
        .filter((p) => p.estado === 'pagado')
        .reduce((s, p) => s + Number(p.monto), 0)

      return {
        fecha,
        pagos: items,
        totalDia,
        proyectos: [...proyMap.values()],
      }
    })
  }, [filtered, sortBy])

  // Selección múltiple
  const seleccionadosList = useMemo(
    () => filtered.filter((p) => selectedIds.has(p.id)),
    [filtered, selectedIds],
  )
  const totalSeleccionado = useMemo(
    () => seleccionadosList.reduce((s, p) => s + Number(p.monto), 0),
    [seleccionadosList],
  )

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

  const copiarTexto = async (texto: string, key: string) => {
    await navigator.clipboard.writeText(texto)
    setCopiadoKey(key)
    setTimeout(() => setCopiadoKey(null), 1800)
  }

  const copiarLoteSeleccionado = async () => {
    if (seleccionadosList.length === 0) return

    const lineas = [
      `=== RESUMEN DE PAGOS AUDITADOS (${seleccionadosList.length} ítems) ===`,
      `Total: ${fmtMoney(totalSeleccionado)}`,
      '',
    ]

    seleccionadosList.forEach((p, idx) => {
      const benef = getBeneficiario(p)
      const destino = getDestinoPago(p)
      const fPago = p.fechaPagoReal ? formatDateOnly(p.fechaPagoReal) : 'Sin fecha'
      const nOp = p.numeroOperacion ? ` · Op: ${p.numeroOperacion}` : ''
      const concepto = p.concepto ?? p.ordenCompra?.concepto ?? 'Pago'
      const proyecto = p.proyecto?.codigo ?? p.ordenCompra?.proyecto?.codigo ?? 'ADM'

      lineas.push(
        `${idx + 1}. [${fPago}] [${proyecto}] ${benef} — ${fmtMoney(Number(p.monto))} (${p.estado.toUpperCase()})${nOp}`,
      )
      lineas.push(`   Concepto: ${concepto}`)
      if (destino.bancoNorm !== 'Sin banco') {
        lineas.push(`   Destino: ${destino.metodoLabel} - ${destino.bancoNorm} ${destino.numero ?? ''}`)
      }
      lineas.push('')
    })

    await navigator.clipboard.writeText(lineas.join('\n'))
    setCopiadoLote(true)
    setTimeout(() => setCopiadoLote(false), 2000)
  }

  // Exportar a CSV compatible con Excel
  const exportarCSV = () => {
    if (filtered.length === 0) return

    const headers = [
      'ID',
      'Estado',
      'Fecha Pago Real',
      'Fecha Programada',
      'Monto (S/)',
      'Beneficiario',
      'Tipo Beneficiario',
      'Centro de Costo',
      'Código Proyecto',
      'Concepto',
      'N° Documento / OC',
      'Método de Pago',
      'Banco / Destino',
      'N° Cuenta / Celular',
      'CCI',
      'N° Operación Bancaria',
      'Liquidado Por',
      'Tiene Comprobante',
      'Nota',
    ]

    const filas = filtered.map((p) => {
      const destino = getDestinoPago(p)
      const proyecto = p.proyecto ?? p.ordenCompra?.proyecto
      return [
        p.id,
        p.estado,
        p.fechaPagoReal ? isoDeFecha(p.fechaPagoReal) : '',
        isoDeFecha(p.fechaProgramada),
        Number(p.monto).toFixed(2),
        `"${getBeneficiario(p).replace(/"/g, '""')}"`,
        p.tipoBeneficiario,
        `"${(proyecto?.nombre ?? 'Administración').replace(/"/g, '""')}"`,
        proyecto?.codigo ?? 'ADM',
        `"${(p.concepto ?? p.ordenCompra?.concepto ?? '').replace(/"/g, '""')}"`,
        p.ordenCompra?.numero ?? 'MANUAL',
        destino.metodoLabel,
        destino.bancoNorm,
        destino.numero ?? '',
        destino.cci ?? '',
        p.numeroOperacion ?? '',
        `"${(p.pagadoPor?.name ?? '').replace(/"/g, '""')}"`,
        p.comprobanteUrl ? 'Sí' : 'No',
        `"${(p.nota ?? '').replace(/"/g, '""')}"`,
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...filas].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `historial-pagos-${hoyISO()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const resetFiltros = () => {
    setSearch('')
    setEstadoFiltro('pagado')
    setProyectoId('todos')
    setBancoFilter('todos')
    setRangoPreestablecido('30d')
    setRangoCustom({})
    setSortBy('fecha_desc')
  }

  const filtrosActivosConteo =
    (estadoFiltro !== 'pagado' ? 1 : 0) +
    (proyectoId !== 'todos' ? 1 : 0) +
    (bancoFilter !== 'todos' ? 1 : 0) +
    (rangoPreestablecido !== '30d' ? 1 : 0) +
    (sortBy !== 'fecha_desc' ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Encabezado con navegación de retorno y acciones principales */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <Link
            href="/pagos"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground mb-1"
          >
            <ArrowLeft className="size-3.5" />
            Volver a pagos pendientes
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Historial de pagos
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Auditoría de desembolsos ejecutados, liquidaciones bancarias por proyecto y obligaciones canceladas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Exportación CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportarCSV}
            disabled={filtered.length === 0}
            className="h-8 gap-1.5 text-xs cursor-pointer"
            title="Exportar registros filtrados a CSV para Excel"
          >
            <Download className="size-3.5" />
            <span>Exportar CSV</span>
          </Button>

          {/* Reporte gráfico PNG oficial */}
          {puedeDescargarReporte && (
            <ReporteButton
              tipo="pagados"
              fecha={fechaHasta || hoyISO()}
              label="Reporte PNG"
              className="h-8 text-xs"
            />
          )}
        </div>
      </div>

      {/* KPI Cards informativas con métricas del período */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total desembolsado */}
        <div className="rounded-xl border border-border bg-white p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Desembolsado
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {fmtMoney(kpis.totalDesembolsado)}
          </p>
          <p className="text-xs text-muted-foreground">
            En {kpis.pagadosCount} {kpis.pagadosCount === 1 ? 'pago liquidado' : 'pagos liquidados'}
          </p>
        </div>

        {/* KPI 2: Cantidad de operaciones pagadas */}
        <div className="rounded-xl border border-border bg-white p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Operaciones Pagadas
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Completadas
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {kpis.pagadosCount}
          </p>
          <p className="text-xs text-muted-foreground">
            Transacciones financieras
          </p>
        </div>

        {/* KPI 3: Beneficiarios atendidos */}
        <div className="rounded-xl border border-border bg-white p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Beneficiarios
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              Atendidos
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {kpis.beneficiariosCount}
          </p>
          <p className="text-xs text-muted-foreground">
            Proveedores y personal
          </p>
        </div>

        {/* KPI 4: Cancelados / Anulados */}
        <div className="rounded-xl border border-border bg-white p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Cancelados
            </span>
            <XCircle className="size-4 text-muted-foreground/60" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-muted-foreground">
            {kpis.canceladosCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {kpis.totalCancelado > 0 ? `${fmtMoney(kpis.totalCancelado)} anulados` : 'Sin pagos anulados'}
          </p>
        </div>
      </div>

      {/* Controles de Filtros, Búsqueda y Alternador de Vistas */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Buscador en tiempo real */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Buscar en historial de pagos"
              placeholder="Buscar por beneficiario, N° operación, OC, banco, cuenta o nota…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
            />
          </div>

          {/* Selector de Rango de Fecha Rápido */}
          <Select
            value={rangoPreestablecido}
            onValueChange={(v) => setRangoPreestablecido(v as RangoPreestablecido)}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <Calendar className="size-3.5 text-muted-foreground mr-1 shrink-0" />
              <SelectValue className="normal-case" placeholder="Rango de fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="mes_actual">Este mes</SelectItem>
              <SelectItem value="mes_anterior">Mes anterior</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="todo">Todo el historial</SelectItem>
              <SelectItem value="personalizado">Personalizado...</SelectItem>
            </SelectContent>
          </Select>

          {/* Selector de Rango Personalizado si se selecciona esa opción */}
          {rangoPreestablecido === 'personalizado' && (
            <div className="w-[240px]">
              <DateRangePicker
                value={rangoCustom}
                onValueChange={setRangoCustom}
                placeholder="Rango de fechas"
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Popover de Filtros Avanzados (Estado, Centro de Costo, Banco, Orden) */}
          <Popover>
            <PopoverTrigger
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                filtrosActivosConteo > 0
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-border bg-white text-muted-foreground hover:text-foreground hover:bg-muted/40',
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

            <PopoverContent align="end" className="w-80 p-4 shadow-lg border border-border bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Filtros avanzados
                  </span>
                  {filtrosActivosConteo > 0 && (
                    <span className="text-xs text-muted-foreground">({filtrosActivosConteo})</span>
                  )}
                </div>
                {filtrosActivosConteo > 0 && (
                  <button
                    type="button"
                    onClick={resetFiltros}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {/* 1. Estado */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Estado del registro
                </label>
                <Select
                  value={estadoFiltro}
                  onValueChange={(v) => setEstadoFiltro(v as EstadoFiltro)}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue className="normal-case" placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagado">Solo Pagados (desembolsados)</SelectItem>
                    <SelectItem value="cancelado">Solo Cancelados</SelectItem>
                    <SelectItem value="todos">Todos los registros cerrados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Centro de Costo */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Centro de costo / Proyecto
                </label>
                <Select value={proyectoId} onValueChange={(v) => setProyectoId(v ?? 'todos')}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue className="normal-case" placeholder="Centro de costo" />
                  </SelectTrigger>
                  <SelectContent>
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

              {/* 3. Destino (Banco / Billetera) */}
              {bancosDisponibles.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground block">
                    Destino (Banco / Billetera)
                  </label>
                  <Select value={bancoFilter} onValueChange={(v) => setBancoFilter(v ?? 'todos')}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue className="normal-case" placeholder="Todos los destinos" />
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
                    <SelectValue className="normal-case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fecha_desc">Más recientes primero</SelectItem>
                    <SelectItem value="fecha_asc">Más antiguos primero</SelectItem>
                    <SelectItem value="monto_desc">Mayor monto</SelectItem>
                    <SelectItem value="monto_asc">Menor monto</SelectItem>
                    <SelectItem value="beneficiario">Beneficiario (A-Z)</SelectItem>
                    <SelectItem value="proyecto">Centro de costo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Alternador de Modo de Vista (Timeline vs Tabla) */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setModoVista('timeline')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-100 cursor-pointer',
                modoVista === 'timeline'
                  ? 'bg-white shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title="Vista agrupada por fecha de liquidación"
            >
              <LayoutList className="size-3.5" />
              <span className="hidden sm:inline">Por fecha</span>
            </button>
            <button
              type="button"
              onClick={() => setModoVista('tabla')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-100 cursor-pointer',
                modoVista === 'tabla'
                  ? 'bg-white shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title="Vista en tabla detallada"
            >
              <TableIcon className="size-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>
        </div>

        {/* Chips de filtros activos para fácil remoción */}
        {filtrosActivosConteo > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-0.5 pt-1">
            <span className="text-[11px] text-muted-foreground mr-1">Filtros:</span>

            {estadoFiltro !== 'pagado' && (
              <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
                <span>Estado: {estadoFiltro === 'cancelado' ? 'Cancelados' : 'Todos'}</span>
                <button
                  type="button"
                  onClick={() => setEstadoFiltro('pagado')}
                  className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                  title="Restablecer a pagados"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

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
                  title="Quitar filtro de obra"
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
                  title="Quitar filtro de banco"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {rangoPreestablecido !== '30d' && (
              <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
                <span>
                  Fecha:{' '}
                  {rangoPreestablecido === '7d'
                    ? 'Últimos 7d'
                    : rangoPreestablecido === 'mes_actual'
                      ? 'Este mes'
                      : rangoPreestablecido === 'mes_anterior'
                        ? 'Mes anterior'
                        : rangoPreestablecido === '90d'
                          ? 'Últimos 90d'
                          : rangoPreestablecido === 'todo'
                            ? 'Todo'
                            : 'Personalizado'}
                </span>
                <button
                  type="button"
                  onClick={() => setRangoPreestablecido('30d')}
                  className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                  title="Restablecer fecha a últimos 30 días"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {sortBy !== 'fecha_desc' && (
              <span className="inline-flex items-center gap-1 rounded bg-muted/70 border border-border px-2 py-0.5 text-[11px] text-foreground">
                <span>
                  Orden:{' '}
                  {sortBy === 'fecha_asc'
                    ? 'Más antiguos'
                    : sortBy === 'monto_desc'
                      ? 'Mayor monto'
                      : sortBy === 'monto_asc'
                        ? 'Menor monto'
                        : sortBy === 'beneficiario'
                          ? 'Beneficiario'
                          : 'Centro costo'}
                </span>
                <button
                  type="button"
                  onClick={() => setSortBy('fecha_desc')}
                  className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                  title="Restablecer orden"
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
      </div>

      {/* Resumen del conteo y montos filtrados */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando <strong>{filtered.length}</strong> de <strong>{pagosHistorialBase.length}</strong> pagos cerrados
        </span>
        <span>
          Monto desembolsado en vista:{' '}
          <strong className="text-foreground font-semibold tabular-nums">
            {fmtMoney(kpis.totalDesembolsado)}
          </strong>
        </span>
      </div>

      {/* CONTENIDO PRINCIPAL: Vacío / Vista Timeline / Vista Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <Search className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              No se encontraron pagos en este período
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Prueba cambiando el rango de fechas, seleccionando otro centro de costo o restableciendo los filtros de búsqueda.
            </p>
          </div>
          {(search || filtrosActivosConteo > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFiltros}
              className="text-xs"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      ) : modoVista === 'timeline' ? (
        /* VISTA 1: AGRUPADA POR FECHA (TIMELINE CONTABLE) */
        <div className="space-y-4">
          {gruposPorFecha.map((grupo) => (
            <div
              key={grupo.fecha}
              className="rounded-xl border border-border bg-white overflow-hidden shadow-xs"
            >
              {/* Encabezado del Día con subtotal desembolsado */}
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {fmtFechaLarga(grupo.fecha)}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    ({grupo.pagos.length} {grupo.pagos.length === 1 ? 'operación' : 'operaciones'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Desembolso del día:</span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {fmtMoney(grupo.totalDia)}
                  </span>
                </div>
              </div>

              {/* Proyectos dentro del día */}
              {grupo.proyectos.map(({ proyecto, pagos: pagosProyecto }) => (
                <div
                  key={proyecto.id}
                  className="border-b border-border last:border-b-0"
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <Link
                        href={proyecto.id !== 'administracion' ? `/proyectos/${proyecto.id}` : '#'}
                        className="text-xs font-semibold text-foreground hover:underline"
                      >
                        {proyecto.nombre}
                      </Link>
                      {proyecto.codigo && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ({proyecto.codigo})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      Subtotal:{' '}
                      {fmtMoney(
                        pagosProyecto
                          .filter((p) => p.estado === 'pagado')
                          .reduce((s, p) => s + Number(p.monto), 0),
                      )}
                    </span>
                  </div>

                  {/* Filas de pagos del proyecto */}
                  <div className="divide-y divide-border">
                    {pagosProyecto.map((p) => renderFilaTimeline(p))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* VISTA 2: TABLA DETALLADA */
        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos los pagos"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 min-w-[130px]">Fecha Pago</th>
                  <th className="px-3 py-3 min-w-[200px]">Concepto / Documento</th>
                  <th className="px-3 py-3 min-w-[220px]">Beneficiario y Destino</th>
                  <th className="px-3 py-3 min-w-[140px]">Centro de Costo</th>
                  <th className="px-3 py-3 min-w-[120px]">N° Operación</th>
                  <th className="px-3 py-3 text-center w-24">Sustento</th>
                  <th className="px-3 py-3 text-right min-w-[120px]">Monto</th>
                  <th className="px-3 py-3 text-center w-24">Estado</th>
                  <th className="px-3 py-3 text-right min-w-[80px]">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => renderFilaTabla(p))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barra Flotante de Selección para Auditoría y Copia en Lote */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-foreground text-background px-4 py-2.5 shadow-xl text-xs animate-in fade-in-0 slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[11px]">
              {selectedIds.size}
            </span>
            <span className="font-medium">
              {selectedIds.size === 1 ? 'pago auditado' : 'pagos auditados'}
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
              className="h-7 text-xs gap-1.5 font-medium cursor-pointer"
            >
              {copiadoLote ? (
                <>
                  <Check className="size-3.5 text-chart-2" />
                  Copiado al portapapeles
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copiar resumen contable
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              title="Deseleccionar todo"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-background hover:bg-background/20 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // RENDER: Fila en Vista Timeline
  function renderFilaTimeline(p: Pago) {
    const isSelected = selectedIds.has(p.id)
    const benef = getBeneficiario(p)
    const destino = getDestinoPago(p)
    const esPagado = p.estado === 'pagado'
    const oc = p.ordenCompra

    const origenTag = oc ? (
      <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-700">
        {oc.numero} {p.porcentaje ? `(${p.porcentaje}%)` : ''}
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
      <div
        key={p.id}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 transition-colors hover:bg-muted/20',
          isSelected ? 'bg-primary/5' : '',
        )}
      >
        {/* Izquierda: Checkbox + Concepto + Beneficiario */}
        <div className="flex items-start gap-3 min-w-0">
          <input
            type="checkbox"
            aria-label={`Seleccionar pago ${p.id}`}
            checked={isSelected}
            onChange={() => toggleSelectOne(p.id)}
            className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer mt-1"
          />

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/pagos/${p.id}`}
                className="font-medium text-foreground hover:text-primary transition-colors text-sm line-clamp-1"
              >
                {p.concepto ?? oc?.concepto ?? 'Pago'}
              </Link>
              {origenTag}
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border',
                  esPagado
                    ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border',
                )}
              >
                {esPagado ? 'Pagado' : 'Cancelado'}
              </span>
            </div>

            {/* Beneficiario y cuenta/banco */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{benef}</span>

              {/* Destino y datos de pago */}
              {destino.esBilletera ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.2 font-bold text-[10px]',
                      destino.billetera === 'yape'
                        ? 'bg-[#732282]/15 text-[#732282]'
                        : 'bg-[#00d1d2]/20 text-[#008283]',
                    )}
                  >
                    {destino.metodoLabel}
                  </span>
                  {destino.numero && (
                    <button
                      type="button"
                      onClick={() => copiarTexto(destino.numero!, `${p.id}-cel`)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                      title="Copiar celular"
                    >
                      <span>{destino.numero}</span>
                      {copiadoKey === `${p.id}-cel` ? (
                        <Check className="size-3 text-chart-2" />
                      ) : (
                        <Copy className="size-3 opacity-50 hover:opacity-100" />
                      )}
                    </button>
                  )}
                </span>
              ) : destino.banco || destino.numero || destino.cci ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                  {destino.bancoNorm && destino.bancoNorm !== 'Sin banco' && (
                    <span className="rounded bg-muted px-1.5 py-0.2 font-semibold text-foreground text-[10px]">
                      {destino.bancoNorm}
                    </span>
                  )}
                  {destino.numero && (
                    <button
                      type="button"
                      onClick={() => copiarTexto(destino.numero!, `${p.id}-num`)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                      title="Copiar cuenta"
                    >
                      <span>{destino.numeroLabel}: {destino.numero}</span>
                      {copiadoKey === `${p.id}-num` ? (
                        <Check className="size-3 text-chart-2" />
                      ) : (
                        <Copy className="size-3 opacity-50 hover:opacity-100" />
                      )}
                    </button>
                  )}
                </span>
              ) : null}

              {/* N° de operación bancaria */}
              {p.numeroOperacion && (
                <button
                  type="button"
                  onClick={() => copiarTexto(p.numeroOperacion!, `${p.id}-op`)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-primary transition-colors cursor-pointer"
                  title="Copiar N° de operación"
                >
                  <span className="text-muted-foreground">Op:</span>
                  <span className="font-semibold">{p.numeroOperacion}</span>
                  {copiadoKey === `${p.id}-op` ? (
                    <Check className="size-3 text-chart-2" />
                  ) : (
                    <Copy className="size-3 opacity-50 hover:opacity-100" />
                  )}
                </button>
              )}
            </div>

            {/* Liquidado por */}
            {p.pagadoPor && (
              <p className="text-[11px] text-muted-foreground">
                Liquidado por {p.pagadoPor.name}
              </p>
            )}
          </div>
        </div>

        {/* Derecha: Comprobante + Monto + Enlace */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          {/* Sustento / Factura adjunta */}
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
            <span className="text-[11px] text-muted-foreground/40 hidden sm:inline">—</span>
          )}

          {/* Monto */}
          <div className="text-right">
            <span
              className={cn(
                'font-bold tabular-nums text-base block',
                esPagado ? 'text-foreground' : 'text-muted-foreground line-through',
              )}
            >
              {fmtMoney(Number(p.monto))}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Prog: {fmtFechaCorta(p.fechaProgramada)}
            </span>
          </div>

          <Link
            href={`/pagos/${p.id}`}
            className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title="Ver detalle del pago"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    )
  }

  // RENDER: Fila en Vista Tabla Detallada
  function renderFilaTabla(p: Pago) {
    const isSelected = selectedIds.has(p.id)
    const benef = getBeneficiario(p)
    const destino = getDestinoPago(p)
    const esPagado = p.estado === 'pagado'
    const proyecto = p.proyecto ?? p.ordenCompra?.proyecto
    const oc = p.ordenCompra

    const ocNumRaw = oc?.numero ?? ''
    const ocNumClean = ocNumRaw.toUpperCase().startsWith('OC') || ocNumRaw.toUpperCase().startsWith('OS')
      ? ocNumRaw
      : ocNumRaw ? `OC ${ocNumRaw}` : null

    return (
      <tr
        key={p.id}
        className={cn(
          'transition-colors duration-100 hover:bg-muted/20',
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

        {/* Fecha de Pago Real */}
        <td className="px-3 py-3">
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-xs">
              {p.fechaPagoReal ? fmtFechaCorta(p.fechaPagoReal) : '—'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Prog: {fmtFechaCorta(p.fechaProgramada)}
            </span>
          </div>
        </td>

        {/* Concepto y Documento */}
        <td className="px-3 py-3">
          <div className="space-y-0.5">
            <Link
              href={`/pagos/${p.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors text-xs line-clamp-1"
            >
              {p.concepto ?? oc?.concepto ?? 'Pago'}
            </Link>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ocNumClean ? (
                <span className="font-mono text-[10px] text-primary font-medium">
                  {ocNumClean}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground capitalize">
                  {p.origen.replace('_', ' ')}
                </span>
              )}
              {p.porcentaje && (
                <span className="text-[10px] text-muted-foreground">
                  ({p.porcentaje}%)
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Beneficiario y Destino */}
        <td className="px-3 py-3">
          <div className="space-y-0.5">
            <p className="font-medium text-foreground text-xs truncate max-w-[220px]" title={benef}>
              {benef}
            </p>

            {destino.esBilletera ? (
              <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                <span
                  className={cn(
                    'rounded px-1 py-0.2 font-bold text-[9px]',
                    destino.billetera === 'yape'
                      ? 'bg-[#732282]/15 text-[#732282]'
                      : 'bg-[#00d1d2]/20 text-[#008283]',
                  )}
                >
                  {destino.metodoLabel}
                </span>
                {destino.numero && (
                  <button
                    type="button"
                    onClick={() => copiarTexto(destino.numero!, `${p.id}-cel`)}
                    className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    title="Copiar celular"
                  >
                    <span>{destino.numero}</span>
                    {copiadoKey === `${p.id}-cel` ? (
                      <Check className="size-2.5 text-chart-2" />
                    ) : (
                      <Copy className="size-2.5 opacity-50" />
                    )}
                  </button>
                )}
              </div>
            ) : destino.banco || destino.numero || destino.cci ? (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                {destino.bancoNorm && destino.bancoNorm !== 'Sin banco' && (
                  <span className="rounded bg-muted px-1 py-0.2 font-semibold text-foreground text-[9px]">
                    {destino.bancoNorm}
                  </span>
                )}
                {destino.numero && (
                  <button
                    type="button"
                    onClick={() => copiarTexto(destino.numero!, `${p.id}-num`)}
                    className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    title="Copiar cuenta"
                  >
                    <span>{destino.numeroLabel}: {destino.numero}</span>
                    {copiadoKey === `${p.id}-num` ? (
                      <Check className="size-2.5 text-chart-2" />
                    ) : (
                      <Copy className="size-2.5 opacity-50" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 italic">Sin datos bancarios</span>
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
              <span className="block font-medium text-foreground truncate max-w-[150px]">
                {proyecto.nombre ?? proyecto.codigo}
              </span>
              {proyecto.nombre && (
                <span className="block text-[10px] text-muted-foreground truncate max-w-[150px]">
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

        {/* N° Operación Bancaria */}
        <td className="px-3 py-3">
          {p.numeroOperacion ? (
            <button
              type="button"
              onClick={() => copiarTexto(p.numeroOperacion!, `${p.id}-op-tbl`)}
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              title="Copiar N° de operación"
            >
              <span>{p.numeroOperacion}</span>
              {copiadoKey === `${p.id}-op-tbl` ? (
                <Check className="size-3 text-chart-2" />
              ) : (
                <Copy className="size-3 opacity-40 hover:opacity-100" />
              )}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
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
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </td>

        {/* Monto */}
        <td className="px-3 py-3 text-right">
          <span
            className={cn(
              'font-bold tabular-nums text-sm',
              esPagado ? 'text-foreground' : 'text-muted-foreground line-through',
            )}
          >
            {fmtMoney(Number(p.monto))}
          </span>
        </td>

        {/* Estado */}
        <td className="px-3 py-3 text-center">
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
              esPagado
                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border',
            )}
          >
            {esPagado ? 'Pagado' : 'Cancelado'}
          </span>
        </td>

        {/* Acciones */}
        <td className="px-3 py-3 text-right">
          <Link
            href={`/pagos/${p.id}`}
            className="inline-flex items-center justify-center size-7 rounded-md border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title="Ver detalle"
          >
            <ChevronRight className="size-4" />
          </Link>
        </td>
      </tr>
    )
  }
}
