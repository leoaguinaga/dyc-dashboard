'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import type { SolicitudItem, UnidadMedida } from '@/types/api'

const UNIDADES: UnidadMedida[] = ['und', 'kg', 'm', 'm2', 'm3', 'l', 'gal', 'bolsa', 'caja', 'rollo', 'par', 'juego']

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
}

const emptyLinea = (solicitudItem?: SolicitudItem): LineaItem => ({
  descripcionProveedor: solicitudItem?.descripcion ?? '',
  solicitudItemId: solicitudItem?.id ?? '',
  precioUnit: '',
  cantidad: solicitudItem ? String(parseFloat(solicitudItem.cantidadCompra)) : '',
  unidad: solicitudItem?.unidad ?? 'und',
})

export function ReceiveCotizacionForm({ cotizacionId, solicitudItems, onCancel }: Props) {
  const router = useRouter()
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [validezDias, setValidezDias] = useState('')
  const [condicionesServicio, setCondicionesServicio] = useState('')
  const [condicionesPago, setCondicionesPago] = useState<CondicionPago[]>([{ porcentaje: '100', fecha: '' }])
  const [condicionPago, setCondicionPago] = useState('')
  const [nota, setNota] = useState('')
  const [lineas, setLineas] = useState<LineaItem[]>(
    solicitudItems.length > 0 ? solicitudItems.map((si) => emptyLinea(si)) : [emptyLinea()],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const sumaPorcentajes = condicionesPago.reduce((s, c) => s + (parseFloat(c.porcentaje) || 0), 0)
  const restante = Math.round((100 - sumaPorcentajes) * 100) / 100
  const sumaCompleta = Math.abs(sumaPorcentajes - 100) < 0.01
  const pagosCompletos = condicionesPago.every((c) => c.porcentaje && parseFloat(c.porcentaje) > 0 && c.fecha)
  const puedeRegistrar = sumaCompleta && pagosCompletos

  function updateLinea(i: number, field: keyof LineaItem, value: string) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`l_${i}_${field}`]; return next })
  }

  function updateCondicionPago(i: number, field: keyof CondicionPago, value: string) {
    setCondicionesPago((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  function agregarCondicionPago() {
    setCondicionesPago((prev) => [
      ...prev,
      { porcentaje: restante > 0 ? String(restante) : '', fecha: '' },
    ])
  }

  function quitarCondicionPago(i: number) {
    setCondicionesPago((prev) => prev.filter((_, idx) => idx !== i))
  }

  function validate() {
    const next: Record<string, string> = {}
    lineas.forEach((l, i) => {
      if (!l.descripcionProveedor.trim()) next[`l_${i}_desc`] = 'Requerido'
      if (!l.precioUnit || parseFloat(l.precioUnit) <= 0) next[`l_${i}_precio`] = 'Requerido'
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
        nota: nota.trim() || undefined,
        items: lineas.map((l) => ({
          descripcionProveedor: l.descripcionProveedor.trim(),
          solicitudItemId: l.solicitudItemId || undefined,
          precioUnit: parseFloat(l.precioUnit),
          cantidad: parseFloat(l.cantidad),
          unidad: l.unidad,
        })),
      })
      router.refresh()
      onCancel()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al registrar la cotización')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de entrega</label>
          <Input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Validez (días)</label>
          <Input
            type="number"
            min="1"
            value={validezDias}
            onChange={(e) => setValidezDias(e.target.value)}
            placeholder="Ej. 30"
            className="h-8 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Condiciones del servicio <span className="font-normal text-muted-foreground/70">(opcional)</span></label>
          <Input
            value={condicionesServicio}
            onChange={(e) => setCondicionesServicio(e.target.value)}
            placeholder="Ej. Incluye instalación, garantía 12 meses…"
            className="h-8 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Otras condiciones de pago <span className="font-normal text-muted-foreground/70">(opcional)</span></label>
          <Input
            value={condicionPago}
            onChange={(e) => setCondicionPago(e.target.value)}
            placeholder="Ej. Detracción 10%, cheque diferido a 15 días"
            className="h-8 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nota <span className="font-normal text-muted-foreground/70">(opcional)</span></label>
          <Input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Observaciones adicionales del proveedor…"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Forma de pago</p>
          <p className={cn('text-xs font-medium tabular-nums', sumaCompleta ? 'text-chart-2' : 'text-muted-foreground')}>
            {sumaCompleta ? 'Suma 100%' : `Faltan ${restante > 0 ? restante : 0}% para 100%`}
          </p>
        </div>

        <div className="hidden sm:grid grid-cols-[100px_1fr_28px] gap-2 px-1">
          <p className="text-xs text-muted-foreground">Porcentaje</p>
          <p className="text-xs text-muted-foreground">Fecha de pago</p>
          <div />
        </div>

        {condicionesPago.map((c, i) => (
          <div key={i} className="grid grid-cols-[100px_1fr_28px] gap-2 items-start">
            <div>
              <Input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={c.porcentaje}
                onChange={(e) => updateCondicionPago(i, 'porcentaje', e.target.value)}
                placeholder="Ej. 50"
                className="h-8 text-sm font-mono"
              />
            </div>
            <div>
              <DatePicker
                value={c.fecha}
                onValueChange={(v) => updateCondicionPago(i, 'fecha', v)}
                placeholder="Seleccionar…"
                className="h-8"
              />
            </div>
            <button
              type="button"
              onClick={() => quitarCondicionPago(i)}
              disabled={condicionesPago.length === 1}
              className="mt-1 flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={agregarCondicionPago}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
        >
          <Plus className="size-3.5" />
          Agregar pago
        </button>
      </div>

      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_28px] gap-2 px-1">
          <p className="text-xs text-muted-foreground">Descripción del proveedor</p>
          <p className="text-xs text-muted-foreground">Precio unit.</p>
          <p className="text-xs text-muted-foreground">Cantidad</p>
          <p className="text-xs text-muted-foreground">Unidad</p>
          <div />
        </div>

        {lineas.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_80px_80px_28px] gap-2 items-start">
            <div>
              <Input
                value={l.descripcionProveedor}
                onChange={(e) => updateLinea(i, 'descripcionProveedor', e.target.value)}
                placeholder="Ej. Plancha OSB 15mm"
                className={cn('h-8 text-sm', errors[`l_${i}_desc`] && 'border-destructive')}
              />
            </div>
            <div>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={l.precioUnit}
                onChange={(e) => updateLinea(i, 'precioUnit', e.target.value)}
                placeholder="0.00"
                className={cn('h-8 text-sm font-mono', errors[`l_${i}_precio`] && 'border-destructive')}
              />
            </div>
            <div>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={l.cantidad}
                onChange={(e) => updateLinea(i, 'cantidad', e.target.value)}
                placeholder="0"
                className={cn('h-8 text-sm font-mono', errors[`l_${i}_cantidad`] && 'border-destructive')}
              />
            </div>
            <div>
              <Select value={l.unidad} onValueChange={(v) => updateLinea(i, 'unidad', v ?? 'und')}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => setLineas((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={lineas.length === 1}
              className="mt-1 flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setLineas((prev) => [...prev, emptyLinea()])}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
        >
          <Plus className="size-3.5" />
          Agregar línea
        </button>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        {!puedeRegistrar && (
          <p className="text-xs text-muted-foreground mr-auto">
            {!sumaCompleta
              ? 'La forma de pago debe sumar 100% para poder registrar la respuesta.'
              : 'Completa el porcentaje y la fecha de cada pago para poder registrar la respuesta.'}
          </p>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={loading || !puedeRegistrar}>
          {loading ? 'Guardando…' : 'Registrar respuesta'}
        </Button>
      </div>
    </form>
  )
}
