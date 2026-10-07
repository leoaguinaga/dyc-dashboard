'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, FileText, History, Paperclip, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, API_ORIGIN } from '@/lib/api/client'
import { UNIDAD_ABBR } from '@/lib/inventario'
import type { CotizacionConHistorial, EstadoCotizacion } from '@/types/api'

const ESTADO_STYLES: Record<EstadoCotizacion, { label: string; cn: string }> = {
  pendiente:      { label: 'Pendiente',     cn: 'bg-muted text-muted-foreground' },
  recibida:       { label: 'Recibida',      cn: 'bg-chart-2/15 text-chart-2' },
  aprobada:       { label: 'Aprobada',      cn: 'bg-chart-2/15 text-chart-2' },
  rechazada:      { label: 'Rechazada',     cn: 'bg-destructive/10 text-destructive' },
  sin_respuesta:  { label: 'Sin respuesta', cn: 'bg-orange-500/15 text-orange-600' },
}

type Filtro = 'compradas' | 'otras' | 'todas'

function num(v: string | number | undefined | null) {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '')
  return isNaN(n) ? 0 : n
}

function money(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function qty(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Una compra se considera concreta si fue aprobada o tiene ítems adjudicados. */
function esComprada(c: CotizacionConHistorial) {
  return c.estado === 'aprobada' || c.items.some((i) => i.seleccionado)
}

/** Ítems que cuentan para el monto: los adjudicados; si no hay marca, todos. */
function itemsEfectivos(c: CotizacionConHistorial) {
  const sel = c.items.filter((i) => i.seleccionado)
  return sel.length > 0 ? sel : c.items
}

function totalCotizacion(c: CotizacionConHistorial) {
  return itemsEfectivos(c).reduce((acc, i) => acc + num(i.precioUnit) * num(i.cantidad), 0)
}

/** Concepto de la compra: requerimiento > OC > nota de la solicitud > primer producto. */
function conceptoDe(c: CotizacionConHistorial) {
  const s = c.solicitud
  return (
    s.requerimiento?.nombre ||
    s.ordenes?.find((o) => o.concepto || o.nombre)?.concepto ||
    s.ordenes?.find((o) => o.nombre)?.nombre ||
    s.nota ||
    c.items[0]?.descripcionProveedor ||
    'Compra sin concepto'
  )
}

interface Props {
  cotizaciones: CotizacionConHistorial[]
}

export function ComprasProveedorSection({ cotizaciones }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('compradas')

  const { compradas, otras } = useMemo(() => {
    const compradas = cotizaciones.filter(esComprada)
    const otras = cotizaciones.filter((c) => !esComprada(c))
    return { compradas, otras }
  }, [cotizaciones])

  const visibles = filtro === 'compradas' ? compradas : filtro === 'otras' ? otras : cotizaciones

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold">Historial de compras</h2>
        <div className="ml-auto flex gap-0.5 rounded-lg bg-muted p-0.5 text-xs">
          {(
            [
              ['compradas', `Compradas · ${compradas.length}`],
              ['otras', `No adjudicadas · ${otras.length}`],
              ['todas', `Todas · ${cotizaciones.length}`],
            ] as [Filtro, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltro(k)}
              className={cn(
                'rounded-md px-2.5 py-1 transition-colors duration-[120ms]',
                filtro === k
                  ? 'bg-white text-foreground shadow-[0_0_0_1px_var(--border)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-10 text-center">
          <History className="size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            {cotizaciones.length === 0
              ? 'Aún no hay compras ni cotizaciones registradas para este proveedor'
              : 'Nada en esta vista'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((c) => (
            <CompraCard key={c.id} cotizacion={c} />
          ))}
        </div>
      )}
    </section>
  )
}

function CompraCard({ cotizacion: c }: { cotizacion: CotizacionConHistorial }) {
  const comprada = esComprada(c)
  const [abierta, setAbierta] = useState(comprada)
  const estado = ESTADO_STYLES[c.estado]
  const items = itemsEfectivos(c)
  const total = totalCotizacion(c)
  const s = c.solicitud
  const ordenes = s.ordenes ?? []

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="grid gap-x-4 gap-y-1 px-5 pb-3.5 pt-4 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <h3
            className={cn(
              'break-words text-[17px] font-semibold leading-snug tracking-tight',
              !comprada && 'font-medium text-muted-foreground',
            )}
          >
            {conceptoDe(c)}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <Link
              href={`/cotizaciones/${s.id}`}
              className="font-mono text-primary underline-offset-2 hover:underline"
            >
              {s.codigo}
            </Link>
            {s.requerimiento && (
              <>
                <Dot />
                <Link
                  href={`/requerimientos/${s.requerimiento.id}`}
                  className="font-mono text-primary underline-offset-2 hover:underline"
                >
                  {s.requerimiento.codigo}
                </Link>
              </>
            )}
            {s.proyecto && (
              <>
                <Dot />
                <span>{s.proyecto.nombre}</span>
              </>
            )}
            <Dot />
            <span>Recibida {fmtDate(c.fechaRecibida)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
          <p
            className={cn(
              'font-mono text-xl font-semibold tabular-nums tracking-tight',
              !comprada && 'text-muted-foreground line-through decoration-muted-foreground/40',
            )}
          >
            <span className="mr-1 text-xs font-medium text-muted-foreground">S/</span>
            {money(total)}
          </p>
          <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', estado.cn)}>
            {estado.label}
          </span>
        </div>
      </div>

      {abierta && items.length > 0 && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2 text-left font-medium">Producto</th>
                <th className="px-5 py-2 text-right font-medium">Cant.</th>
                <th className="px-5 py-2 text-right font-medium">P. unit.</th>
                <th className="px-5 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-5 py-2.5 font-medium">{i.descripcionProveedor}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums">
                    {qty(num(i.cantidad))} <span className="text-xs text-muted-foreground">{UNIDAD_ABBR[i.unidad]}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums">
                    {num(i.precioUnit) > 0 ? `S/ ${money(num(i.precioUnit))}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums">
                    {num(i.precioUnit) > 0 ? `S/ ${money(num(i.precioUnit) * num(i.cantidad))}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Condiciones cotizacion={c} ordenes={ordenes} />

      {!comprada && (
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="flex w-full items-center justify-between border-t border-border px-5 py-2.5 text-xs text-muted-foreground transition-colors duration-[120ms] hover:bg-muted/40"
        >
          <span>{abierta ? 'Ocultar' : 'Ver'} {c.items.length} producto{c.items.length === 1 ? '' : 's'}</span>
          <ChevronDown className={cn('size-3.5 transition-transform duration-[120ms]', abierta && 'rotate-180')} />
        </button>
      )}
    </article>
  )
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-muted-foreground/40" aria-hidden />
}

function Condiciones({
  cotizacion: c,
  ordenes,
}: {
  cotizacion: CotizacionConHistorial
  ordenes: NonNullable<CotizacionConHistorial['solicitud']['ordenes']>
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      const result = await api.upload<{ nombre: string; url: string }>(
        '/solicitudes-cotizacion/cotizaciones/archivos',
        formData,
      )
      await api.post(`/solicitudes-cotizacion/cotizaciones/${c.id}/archivos`, {
        nombre: result.nombre,
        url: result.url,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const pagos =
    c.condicionesPago.length > 0
      ? c.condicionesPago.map((cp) => `${parseFloat(cp.porcentaje)}% · ${fmtDate(cp.fecha)}`).join('  /  ')
      : c.condicionPago || null

  return (
    <div className="border-t border-border bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <Dato label="Entrega" value={c.fechaEntrega ? fmtDate(c.fechaEntrega) : null} mono />
        <Dato label="Pago" value={pagos} />
        {c.validezDias ? <Dato label="Validez" value={`${c.validezDias} días`} /> : null}
        <Dato label="IGV" value={c.incluyeIgv ? 'incluido' : 'no incluido'} />
        {ordenes.map((o) => (
          <span key={o.id}>
            OC{' '}
            <Link
              href={`/ordenes-compra/${o.id}`}
              className="font-mono font-medium text-primary underline-offset-2 hover:underline"
            >
              {o.numero}
            </Link>
          </span>
        ))}

        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {(c.archivos ?? []).map((a) => (
            <a
              key={a.id}
              href={`${API_ORIGIN}${a.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2 py-0.5 text-foreground transition-colors duration-[120ms] hover:bg-muted"
            >
              <FileText className="size-3.5" />
              {a.nombre}
            </a>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-white px-2 py-0.5 transition-colors duration-[120ms] hover:bg-muted disabled:opacity-50"
          >
            {uploading ? <Upload className="size-3.5 animate-pulse" /> : <Paperclip className="size-3.5" />}
            {uploading ? 'Subiendo…' : 'Adjuntar PDF'}
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        </span>
      </div>
      {c.condicionesServicio && <p className="mt-1.5">{c.condicionesServicio}</p>}
      {error && <p className="mt-1.5 text-destructive">{error}</p>}
    </div>
  )
}

function Dato({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <span>
      {label}{' '}
      {value ? (
        <b className={cn('font-medium text-foreground', mono && 'font-mono')}>{value}</b>
      ) : (
        <span className="text-muted-foreground/60">—</span>
      )}
    </span>
  )
}
