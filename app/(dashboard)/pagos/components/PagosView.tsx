'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { Pago } from '@/types/api'
import { cn, formatDateOnly } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { ReporteButton } from './ReporteButton'

const ESTADO_LABEL: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  pagado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoDeFecha(fecha: string) {
  return fecha.slice(0, 10)
}

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function fmtFechaLarga(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

interface Grupo {
  fecha: string
  etiqueta?: string
  pagos: Pago[]
}

function agruparPorProyecto(pagos: Pago[]) {
  const map = new Map<string, { proyecto: Pago['ordenCompra']['proyecto']; pagos: Pago[] }>()
  for (const p of pagos) {
    const proyecto = p.ordenCompra.proyecto
    if (!map.has(proyecto.id)) map.set(proyecto.id, { proyecto, pagos: [] })
    map.get(proyecto.id)!.pagos.push(p)
  }
  return [...map.values()]
}

function FilaPago({ p, fechaLabel }: { p: Pago; fechaLabel: 'programada' | 'real' }) {
  return (
    <Link
      href={`/pagos/${p.id}`}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors duration-[120ms]"
    >
      <div className="flex items-center gap-2 min-w-0">
        {p.estadoEfectivo === 'vencido' && <AlertTriangle className="size-3.5 shrink-0 text-destructive" />}
        <div className="min-w-0">
          <span className="font-mono text-sm font-medium">{p.ordenCompra.numero}</span>
          <p className="truncate text-xs text-muted-foreground">
            {p.ordenCompra.concepto ?? 'Sin concepto'}
          </p>
          <p className="truncate text-xs text-muted-foreground/80">
            {p.tipoBeneficiario === 'trabajador'
              ? `Depósito a ${p.beneficiarioTrabajador?.nombre ?? p.ordenCompra.creadoPor.name}`
              : (p.ordenCompra.proveedor?.razonSocial ?? p.ordenCompra.proveedorNombreLibre)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[p.estadoEfectivo])}>
          {ESTADO_LABEL[p.estadoEfectivo]}
        </span>
        <span className="w-28 text-right text-sm font-medium tabular-nums">{fmtMoney(Number(p.monto))}</span>
      </div>
      <span className="sr-only">{fechaLabel}</span>
    </Link>
  )
}

function GrupoFecha({ grupo, fechaLabel }: { grupo: Grupo; fechaLabel: 'programada' | 'real' }) {
  const porProyecto = agruparPorProyecto(grupo.pagos)
  const total = grupo.pagos.reduce((s, p) => s + Number(p.monto), 0)

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-sm font-semibold capitalize">
          {grupo.etiqueta ?? fmtFechaLarga(grupo.fecha)}
        </p>
        <p className="text-xs text-muted-foreground">{fmtMoney(total)}</p>
      </div>
      {porProyecto.map(({ proyecto, pagos }) => (
        <div key={proyecto.id} className="border-b border-border last:border-b-0">
          <div className="px-4 py-2.5">
            <Link href={`/proyectos/${proyecto.id}`} className="block min-w-0 hover:text-foreground transition-colors duration-[120ms]">
              <span className="block truncate text-sm font-semibold text-foreground">{proyecto.nombre}</span>
              <span className="block truncate font-mono text-xs text-muted-foreground">
                {proyecto.codigo ?? 'Sin código'}
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pagos.map((p) => (
              <FilaPago key={p.id} p={p} fechaLabel={fechaLabel} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PagosView({ pagos }: { pagos: Pago[] }) {
  const [tab, setTab] = useState<'pendientes' | 'pagados'>('pendientes')
  const [fechaReporte, setFechaReporte] = useState(hoyISO)
  const [rangoDias, setRangoDias] = useState(7)

  const pendientes = useMemo(() => {
    const hoy = hoyISO()
    const en7 = new Date()
    en7.setDate(en7.getDate() + 7)
    const en7iso = isoDeFecha(en7.toISOString())

    const items = pagos.filter((p) => p.estado === 'pendiente')
    const vencidos = items.filter((p) => p.estadoEfectivo === 'vencido')
    const deHoy = items.filter((p) => p.estadoEfectivo !== 'vencido' && isoDeFecha(p.fechaProgramada) === hoy)
    const proximos = items.filter(
      (p) => p.estadoEfectivo !== 'vencido' && isoDeFecha(p.fechaProgramada) > hoy && isoDeFecha(p.fechaProgramada) <= en7iso,
    )
    const resto = items.filter(
      (p) => p.estadoEfectivo !== 'vencido' && isoDeFecha(p.fechaProgramada) > en7iso,
    )

    const grupos: Grupo[] = []
    if (vencidos.length) grupos.push({ fecha: hoy, etiqueta: 'Vencidos', pagos: vencidos })
    if (deHoy.length) grupos.push({ fecha: hoy, etiqueta: 'Hoy', pagos: deHoy })
    if (proximos.length) grupos.push({ fecha: hoy, etiqueta: 'Próximos 7 días', pagos: proximos })

    const porFecha = new Map<string, Pago[]>()
    for (const p of resto) {
      const f = isoDeFecha(p.fechaProgramada)
      if (!porFecha.has(f)) porFecha.set(f, [])
      porFecha.get(f)!.push(p)
    }
    for (const [fecha, ps] of [...porFecha.entries()].sort()) {
      grupos.push({ fecha, pagos: ps })
    }
    return grupos
  }, [pagos])

  const pagados = useMemo(() => {
    const desde = new Date()
    desde.setDate(desde.getDate() - rangoDias)
    const desdeIso = isoDeFecha(desde.toISOString())

    const items = pagos.filter(
      (p) => p.estado === 'pagado' && p.fechaPagoReal && isoDeFecha(p.fechaPagoReal) >= desdeIso,
    )
    const porFecha = new Map<string, Pago[]>()
    for (const p of items) {
      const f = isoDeFecha(p.fechaPagoReal!)
      if (!porFecha.has(f)) porFecha.set(f, [])
      porFecha.get(f)!.push(p)
    }
    return [...porFecha.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([fecha, ps]): Grupo => ({ fecha, pagos: ps }))
  }, [pagos, rangoDias])

  const grupos = tab === 'pendientes' ? pendientes : pagados

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            onClick={() => setTab('pendientes')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]',
              tab === 'pendientes' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pendientes
          </button>
          <button
            onClick={() => setTab('pagados')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]',
              tab === 'pagados' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pagados
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'pagados' && (
            <select
              value={rangoDias}
              onChange={(e) => setRangoDias(Number(e.target.value))}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          )}
          <DatePicker value={fechaReporte} onValueChange={setFechaReporte} className="w-40" />
          <ReporteButton tipo={tab} fecha={fechaReporte} label="Descargar reporte" />
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {tab === 'pendientes' ? 'No hay pagos pendientes' : 'No hay pagos registrados en este rango'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((g, i) => (
            <GrupoFecha key={`${g.fecha}-${g.etiqueta ?? i}`} grupo={g} fechaLabel={tab === 'pendientes' ? 'programada' : 'real'} />
          ))}
        </div>
      )}
    </div>
  )
}
