'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Receipt, AlertCircle, Sparkles, Paperclip, FileText, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { UNIDAD_OPTIONS } from '@/lib/inventario'
import type { Cotizacion, SolicitudItem, UnidadMedida } from '@/types/api'

interface LineaItem {
  descripcionProveedor: string
  solicitudItemId: string
  precioUnit: string
  cantidad: string
  unidad: UnidadMedida
}

interface CondicionPago {
  porcentaje: string
  fecha: string
}

interface Props {
  cotizacionId: string
  solicitudItems: SolicitudItem[]
  onCancel: () => void
  /** Cuando se pasa, el formulario precarga estos datos para corregir una
   * respuesta ya registrada (recibida/aprobada) en lugar de partir en blanco. */
  cotizacionExistente?: Cotizacion
}

const emptyLinea = (solicitudItem?: SolicitudItem): LineaItem => ({
  descripcionProveedor: solicitudItem?.descripcion ?? '',
  solicitudItemId: solicitudItem?.id ?? '',
  precioUnit: '',
  cantidad: solicitudItem ? String(parseFloat(solicitudItem.cantidadCompra)) : '',
  unidad: solicitudItem?.unidad ?? 'und',
})

function lineaFromCotizacionItem(item: Cotizacion['items'][number]): LineaItem {
  return {
    descripcionProveedor: item.descripcionProveedor,
    solicitudItemId: item.solicitudItemId ?? '',
    precioUnit: String(parseFloat(item.precioUnit)),
    cantidad: String(parseFloat(item.cantidad)),
    unidad: item.unidad,
  }
}

function fmtPEN(value: number) {
  if (isNaN(value) || !isFinite(value)) return 'S/ 0.00'
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function addDaysToIso(dateStr: string | undefined, days: number): string {
  const baseDate = dateStr && !isNaN(Date.parse(dateStr)) ? new Date(dateStr + 'T00:00:00') : new Date()
  baseDate.setDate(baseDate.getDate() + days)
  return baseDate.toISOString().slice(0, 10)
}

type PresetPago = 'contado' | 'credito_30' | 'credito_15' | 'anticipo_50_50'

export function ReceiveCotizacionForm({ cotizacionId, solicitudItems, onCancel, cotizacionExistente: c }: Props) {
  const router = useRouter()
  const [fechaEntrega, setFechaEntrega] = useState(c?.fechaEntrega?.slice(0, 10) ?? '')
  const [validezDias, setValidezDias] = useState(c?.validezDias ? String(c.validezDias) : '')
  const [condicionesServicio, setCondicionesServicio] = useState(c?.condicionesServicio ?? '')
  const [condicionesPago, setCondicionesPago] = useState<CondicionPago[]>(
    c && c.condicionesPago.length > 0
      ? c.condicionesPago.map((cp) => ({ porcentaje: String(cp.porcentaje), fecha: cp.fecha.slice(0, 10) }))
      : [{ porcentaje: '100', fecha: '' }],
  )
  const [condicionPago, setCondicionPago] = useState(c?.condicionPago ?? '')
  const [presetActivo, setPresetActivo] = useState<PresetPago | null>(null)
  const [incluyeIgv, setIncluyeIgv] = useState(c?.incluyeIgv ?? false)
  const [nota, setNota] = useState(c?.nota ?? '')
  const [lineas, setLineas] = useState<LineaItem[]>(
    c && c.items.length > 0
      ? c.items.map(lineaFromCotizacionItem)
      : solicitudItems.length > 0 ? solicitudItems.map((si) => emptyLinea(si)) : [emptyLinea()],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null)
  const [archivoError, setArchivoError] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') {
      setArchivoError('Solo se permiten archivos PDF')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setArchivoError('El archivo no debe superar los 15 MB')
      return
    }
    setArchivoError(null)
    setArchivoPdf(file)
  }

  const sumaPorcentajes = condicionesPago.reduce((s, c) => s + (parseFloat(c.porcentaje) || 0), 0)
  const restante = Math.round((100 - sumaPorcentajes) * 100) / 100
  const sumaCompleta = Math.abs(sumaPorcentajes - 100) < 0.01
  const pagosCompletos = condicionesPago.every((c) => c.porcentaje && parseFloat(c.porcentaje) > 0 && c.fecha)
  const puedeRegistrar = sumaCompleta && pagosCompletos

  // Cálculos Financieros en Tiempo Real
  const itemsTotal = lineas.reduce((sum, l) => {
    const p = parseFloat(l.precioUnit) || 0
    const q = parseFloat(l.cantidad) || 0
    return sum + p * q
  }, 0)

  // Lógica oficial de IGV de DYC (conforme a OcPdfDocument)
  const subtotalNeto = incluyeIgv ? itemsTotal / 1.18 : itemsTotal
  const igvMonto = incluyeIgv ? itemsTotal - subtotalNeto : itemsTotal * 0.18
  const totalCotizado = incluyeIgv ? itemsTotal : subtotalNeto + igvMonto

  function updateLinea(i: number, field: keyof LineaItem, value: string) {
    if (field === 'precioUnit') {
      const parts = value.split('.')
      if (parts.length > 1 && parts[1].length > 4) {
        return
      }
    }
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`l_${i}_${field}`]; return next })
  }

  function updateCondicionPago(i: number, field: keyof CondicionPago, value: string) {
    setPresetActivo(null)
    setCondicionesPago((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  function agregarCondicionPago() {
    setPresetActivo(null)
    setCondicionesPago((prev) => [
      ...prev,
      { porcentaje: restante > 0 ? String(restante) : '', fecha: '' },
    ])
  }

  function quitarCondicionPago(i: number) {
    setPresetActivo(null)
    setCondicionesPago((prev) => prev.filter((_, idx) => idx !== i))
  }

  function aplicarPresetPago(tipo: PresetPago) {
    setPresetActivo(tipo)
    const fechaRef = fechaEntrega || new Date().toISOString().slice(0, 10)
    if (tipo === 'contado') {
      setCondicionesPago([{ porcentaje: '100', fecha: fechaRef }])
      if (!condicionPago.trim()) setCondicionPago('Contado')
    } else if (tipo === 'credito_30') {
      setCondicionesPago([{ porcentaje: '100', fecha: addDaysToIso(fechaRef, 30) }])
      if (!condicionPago.trim()) setCondicionPago('Crédito a 30 días')
    } else if (tipo === 'credito_15') {
      setCondicionesPago([{ porcentaje: '100', fecha: addDaysToIso(fechaRef, 15) }])
      if (!condicionPago.trim()) setCondicionPago('Crédito a 15 días')
    } else if (tipo === 'anticipo_50_50') {
      const hoy = new Date().toISOString().slice(0, 10)
      setCondicionesPago([
        { porcentaje: '50', fecha: hoy },
        { porcentaje: '50', fecha: fechaRef },
      ])
      if (!condicionPago.trim()) setCondicionPago('50% anticipo, 50% contra entrega')
    }
  }

  function validate() {
    const next: Record<string, string> = {}
    lineas.forEach((l, i) => {
      if (!l.descripcionProveedor.trim()) next[`l_${i}_desc`] = 'Requerido'
      if (!l.precioUnit || parseFloat(l.precioUnit) <= 0) {
        next[`l_${i}_precio`] = 'Requerido'
      } else {
        const parts = l.precioUnit.split('.')
        if (parts.length > 1 && parts[1].length > 4) {
          next[`l_${i}_precio`] = 'Máximo 4 decimales'
        }
      }
      if (!l.cantidad || parseFloat(l.cantidad) <= 0) next[`l_${i}_cantidad`] = 'Requerido'
    })
    setErrors(next)
    return Object.keys(next).length === 0 && puedeRegistrar
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      await api.patch(`/solicitudes-cotizacion/cotizaciones/${cotizacionId}/recibir`, {
        fechaEntrega: fechaEntrega || undefined,
        validezDias: validezDias ? parseInt(validezDias) : undefined,
        condicionesServicio: condicionesServicio.trim() || undefined,
        condicionesPago: condicionesPago.map((c) => ({
          porcentaje: parseFloat(c.porcentaje),
          fecha: c.fecha,
        })),
        condicionPago: condicionPago.trim() || undefined,
        incluyeIgv,
        nota: nota.trim() || undefined,
        items: lineas.map((l) => ({
          descripcionProveedor: l.descripcionProveedor.trim(),
          solicitudItemId: l.solicitudItemId || undefined,
          precioUnit: parseFloat(Number(parseFloat(l.precioUnit)).toFixed(4)),
          cantidad: parseFloat(l.cantidad),
          unidad: l.unidad,
        })),
      })

      if (archivoPdf) {
        try {
          const formData = new FormData()
          formData.append('archivo', archivoPdf)
          const result = await api.upload<{ nombre: string; url: string }>(
            '/solicitudes-cotizacion/cotizaciones/archivos',
            formData,
          )
          await api.post(`/solicitudes-cotizacion/cotizaciones/${cotizacionId}/archivos`, {
            nombre: result.nombre,
            url: result.url,
          })
        } catch (uploadErr) {
          console.error('Error al subir el archivo adjunto:', uploadErr)
        }
      }

      router.refresh()
      onCancel()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al registrar la cotización')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-1">
      {/* ─── 1. Plazos y Oferta Comercial ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Fecha estimada de entrega</label>
          <Input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="h-8 text-sm bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Validez de la oferta (días)</label>
          <Input
            type="number"
            min="1"
            value={validezDias}
            onChange={(e) => setValidezDias(e.target.value)}
            placeholder="Ej. 30"
            className="h-8 text-sm bg-white"
          />
        </div>
      </div>

      {/* ─── 2. Condiciones Comerciales y Forma de Pago ─── */}
      <div className="space-y-4 border-border pt-4 pb-5 border-y">
        {/* Forma de pago */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Forma de Pago
            </label>
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full tabular-nums',
              sumaCompleta ? 'bg-chart-2/15 text-chart-2' : 'bg-amber-500/15 text-amber-600'
            )}>
              {sumaCompleta ? '✓ Suma 100%' : `Faltan ${restante > 0 ? restante : 0}% para 100%`}
            </span>
          </div>

          {/* Presets rápidos de pago */}
          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
            <button
              type="button"
              onClick={() => aplicarPresetPago('contado')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors duration-[120ms]',
                presetActivo === 'contado'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white hover:bg-muted hover:border-foreground/30 text-foreground border-border'
              )}
            >
              100% Contado
            </button>
            <button
              type="button"
              onClick={() => aplicarPresetPago('credito_30')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors duration-[120ms]',
                presetActivo === 'credito_30'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white hover:bg-muted hover:border-foreground/30 text-foreground border-border'
              )}
            >
              Crédito 30 días
            </button>
            <button
              type="button"
              onClick={() => aplicarPresetPago('credito_15')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors duration-[120ms]',
                presetActivo === 'credito_15'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white hover:bg-muted hover:border-foreground/30 text-foreground border-border'
              )}
            >
              Crédito 15 días
            </button>
            <button
              type="button"
              onClick={() => aplicarPresetPago('anticipo_50_50')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors duration-[120ms]',
                presetActivo === 'anticipo_50_50'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white hover:bg-muted hover:border-foreground/30 text-foreground border-border'
              )}
            >
              50% Anticipo / 50% Entrega
            </button>
          </div>

          <div className="hidden sm:grid grid-cols-[110px_1fr_28px] gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span>Porcentaje (%)</span>
            <span>Fecha estimada de pago</span>
            <span />
          </div>

          {condicionesPago.map((c, i) => (
            <div key={i} className="grid grid-cols-[110px_1fr_28px] gap-2 items-start">
              <div>
                <Input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={c.porcentaje}
                  onChange={(e) => updateCondicionPago(i, 'porcentaje', e.target.value)}
                  placeholder="Ej. 100"
                  className="h-8 text-sm font-mono text-right"
                />
              </div>
              <div>
                <DatePicker
                  value={c.fecha}
                  onValueChange={(v) => updateCondicionPago(i, 'fecha', v)}
                  placeholder="Seleccionar fecha…"
                  className="h-8"
                />
              </div>
              <button
                type="button"
                onClick={() => quitarCondicionPago(i)}
                disabled={condicionesPago.length === 1}
                aria-label="Eliminar cuota"
                className="mt-0.5 flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={agregarCondicionPago}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-[120ms] py-1"
          >
            <Plus className="size-3.5" />
            Agregar cuota de pago
          </button>
        </div>

        {/* Condiciones adicionales y notas */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Condiciones del servicio <span className="font-normal text-muted-foreground/70">(opcional)</span>
            </label>
            <Input
              value={condicionesServicio}
              onChange={(e) => setCondicionesServicio(e.target.value)}
              placeholder="Ej. Incluye flete y descarga en obra, garantía 12 meses…"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Otras condiciones de pago <span className="font-normal text-muted-foreground/70">(opcional)</span>
            </label>
            <Input
              value={condicionPago}
              onChange={(e) => setCondicionPago(e.target.value)}
              placeholder="Ej. Detracción 10%, cheque diferido a 15 días…"
              className="h-8 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Observaciones o nota interna <span className="font-normal text-muted-foreground/70">(opcional)</span>
            </label>
            <Input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Observaciones adicionales relevantes para la comparativa…"
              className="h-8 text-sm"
            />
          </div>

          {/* Adjuntar Proforma PDF */}
          <div className="sm:col-span-2 space-y-1.5 pt-1">
            <label className="block text-xs font-medium text-muted-foreground">
              Proforma o cotización oficial en PDF <span className="font-normal text-muted-foreground/70">(opcional)</span>
            </label>
            {!archivoPdf ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border hover:border-foreground/40 bg-muted/20 hover:bg-muted/50 cursor-pointer text-xs font-medium text-foreground transition-colors duration-[120ms]">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  <span>Adjuntar proforma en PDF</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
                {c?.archivos && c.archivos.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-[11px]">Ya adjunto:</span>
                    {c.archivos.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/70">
                        <FileText className="size-3 text-red-500" />
                        <span className="truncate max-w-[160px]">{a.nombre}</span>
                      </span>
                    ))}
                  </div>
                )}
                {archivoError && (
                  <p className="text-[11px] text-destructive font-medium">{archivoError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30 w-fit text-xs">
                <FileText className="size-4 text-red-500 shrink-0" />
                <span className="font-medium text-foreground max-w-xs truncate">{archivoPdf.name}</span>
                <span className="text-muted-foreground text-[11px]">
                  ({(archivoPdf.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <button
                  type="button"
                  onClick={() => setArchivoPdf(null)}
                  className="ml-1 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Quitar archivo"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. Matriz de Ítems y Precios Cotizados ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium text-foreground">
              Ítems y Precios Cotizados ({lineas.length})
            </h3>
          </div>
        </div>

        {/* Encabezados de tabla */}
        <div className="hidden sm:grid grid-cols-[1fr_105px_80px_90px_100px_28px] gap-2 px-1 text-xs font-medium text-muted-foreground">
          <span>Descripción del proveedor</span>
          <span className="text-right">Precio unit.</span>
          <span className="text-right">Cantidad</span>
          <span>Unidad</span>
          <span className="text-right">Subtotal</span>
          <span />
        </div>

        {/* Filas de ítems */}
        <div className="space-y-2">
          {lineas.map((l, i) => {
            const itemReq = solicitudItems.find((si) => si.id === l.solicitudItemId)
            const subtotalLinea = (parseFloat(l.precioUnit) || 0) * (parseFloat(l.cantidad) || 0)

            return (
              <div key={i} className="rounded-md border border-border/80 bg-white p-2 sm:p-0 sm:border-0 sm:bg-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_105px_80px_90px_100px_28px] gap-2 items-start">
                  <div>
                    <Input
                      value={l.descripcionProveedor}
                      onChange={(e) => updateLinea(i, 'descripcionProveedor', e.target.value)}
                      placeholder="Ej. Plancha OSB 15mm"
                      className={cn('h-8 text-sm', errors[`l_${i}_desc`] && 'border-destructive focus-visible:ring-destructive')}
                    />
                    {itemReq && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/85 font-sans">
                        <span className="font-medium text-foreground/75">Solicitado:</span>
                        <span>{parseFloat(itemReq.cantidadCompra)} {itemReq.unidad}</span>
                        <span>·</span>
                        <span className="truncate">{itemReq.item?.nombre ?? itemReq.descripcion}</span>
                      </div>
                    )}
                    {errors[`l_${i}_desc`] && (
                      <span className="text-[11px] text-destructive font-medium">{errors[`l_${i}_desc`]}</span>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={l.precioUnit}
                        onChange={(e) => updateLinea(i, 'precioUnit', e.target.value)}
                        placeholder="0.0000"
                        className={cn(
                          'h-8 text-sm font-mono text-right pl-2 pr-2',
                          errors[`l_${i}_precio`] && 'border-destructive focus-visible:ring-destructive'
                        )}
                      />
                    </div>
                    {errors[`l_${i}_precio`] && (
                      <span className="text-[11px] text-destructive font-medium">{errors[`l_${i}_precio`]}</span>
                    )}
                  </div>

                  <div>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={l.cantidad}
                      onChange={(e) => updateLinea(i, 'cantidad', e.target.value)}
                      placeholder="0"
                      className={cn(
                        'h-8 text-sm font-mono text-right',
                        errors[`l_${i}_cantidad`] && 'border-destructive focus-visible:ring-destructive'
                      )}
                    />
                    {errors[`l_${i}_cantidad`] && (
                      <span className="text-[11px] text-destructive font-medium">{errors[`l_${i}_cantidad`]}</span>
                    )}
                  </div>

                  <div>
                    <Select value={l.unidad} onValueChange={(v) => updateLinea(i, 'unidad', v ?? 'und')}>
                      <SelectTrigger className="h-8 text-sm bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDAD_OPTIONS.map(([u, label]) => (
                          <SelectItem key={u} value={u}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-8 flex items-center justify-end px-1.5 font-mono text-xs tabular-nums font-medium text-foreground bg-muted/30 rounded border border-border/40 sm:border-0 sm:bg-transparent">
                    <span className="sm:hidden text-muted-foreground mr-auto text-[11px]">Subtotal:</span>
                    {fmtPEN(subtotalLinea)}
                  </div>

                  <button
                    type="button"
                    onClick={() => setLineas((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={lineas.length === 1}
                    aria-label="Eliminar ítem"
                    className="mt-0.5 flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setLineas((prev) => [...prev, emptyLinea()])}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-[120ms] py-1"
        >
          <Plus className="size-3.5" />
          Agregar línea
        </button>

        {/* ─── Card de Resumen Económico en Vivo ─── */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-white to-muted/20 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Control de IGV */}
            <div className="flex items-start gap-3 max-w-md">
              <Switch
                id="toggle-igv"
                checked={incluyeIgv}
                onCheckedChange={(v) => setIncluyeIgv(v)}
                className="mt-0.5"
              />
              <label htmlFor="toggle-igv" className="cursor-pointer select-none">
                <span className="text-xs font-semibold text-foreground block">
                  Los precios cotizados incluyen IGV
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                  {incluyeIgv
                    ? 'Precios con IGV (18% desglosado de la base imponible)'
                    : 'Precios netos (se adicionará el 18% de IGV al total)'}
                </span>
              </label>
            </div>

            {/* Desglose Numérico */}
            <div className="w-full sm:w-64 space-y-1.5 text-xs border-t sm:border-t-0 sm:border-l sm:border-border sm:pl-5 pt-3 sm:pt-0">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal neto:</span>
                <span className="font-mono tabular-nums">{fmtPEN(subtotalNeto)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IGV (18%):</span>
                <span className="font-mono tabular-nums">{fmtPEN(igvMonto)}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-semibold text-foreground border-t border-border/80 pt-1.5">
                <span>Total Cotizado:</span>
                <span className="font-mono tabular-nums text-base text-primary font-bold">
                  {fmtPEN(totalCotizado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* ─── 4. Barra de Acciones y Guardado ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
        {!puedeRegistrar ? (
          <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <AlertCircle className="size-3.5 shrink-0" />
            {!sumaCompleta
              ? `La forma de pago debe sumar 100% (actual: ${sumaPorcentajes.toFixed(2)}%)`
              : 'Completa el porcentaje y la fecha de cada cuota para poder registrar.'}
          </p>
        ) : (
          <div />
        )}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading || !puedeRegistrar}>
            {loading ? 'Guardando…' : c ? 'Guardar corrección' : 'Registrar respuesta'}
          </Button>
        </div>
      </div>
    </form>
  )
}
