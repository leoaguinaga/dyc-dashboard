'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Upload, Trash2, Calendar, CreditCard, Smartphone } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { Pago } from '@/types/api'
import { getDestinoPago } from '@/lib/pagos-utils'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ARCHIVOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const METODOS_SUGERIDOS = [
  'Yape',
  'Plin',
  'Transferencia BCP',
  'Transferencia BBVA',
  'Transferencia Interbank',
  'Transferencia Scotiabank',
  'Transferencia Banco de la Nación',
  'Cheque',
  'Efectivo',
]

interface Props {
  pago: Pago | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPagoCompletado?: (pagoId: string) => void
}

export function MarcarPagadoDrawer({
  pago,
  open,
  onOpenChange,
  onPagoCompletado,
}: Props) {
  const router = useRouter()
  const [fechaPagoReal, setFechaPagoReal] = useState(hoyISO)
  const [metodoPago, setMetodoPago] = useState('Transferencia BCP')
  const [numeroOperacion, setNumeroOperacion] = useState('')
  const [comprobanteNombre, setComprobanteNombre] = useState(pago?.comprobanteNombre ?? '')
  const [comprobanteUrl, setComprobanteUrl] = useState(pago?.comprobanteUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen && pago) {
      setFechaPagoReal(hoyISO())
      const destino = getDestinoPago(pago)

      if (destino.billetera === 'yape') {
        setMetodoPago('Yape')
      } else if (destino.billetera === 'plin') {
        setMetodoPago('Plin')
      } else if (pago.metodoPago) {
        setMetodoPago(pago.metodoPago)
      } else if (destino.bancoNorm && destino.bancoNorm !== 'Sin banco') {
        setMetodoPago(`Transferencia ${destino.bancoNorm}`)
      } else {
        setMetodoPago('Transferencia')
      }

      setNumeroOperacion('')
      setComprobanteNombre(pago.comprobanteNombre ?? '')
      setComprobanteUrl(pago.comprobanteUrl ?? '')
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  if (!pago) return null

  const beneficiario =
    pago.tipoBeneficiario === 'trabajador'
      ? (pago.beneficiarioTrabajador?.nombre ?? pago.beneficiarioNombre ?? 'Trabajador')
      : (pago.beneficiarioNombre ??
        pago.ordenCompra?.proveedor?.razonSocial ??
        pago.ordenCompra?.proveedorNombreLibre ??
        'Sin beneficiario')

  const destino = getDestinoPago(pago)
  const proyecto = pago.proyecto ?? pago.ordenCompra?.proyecto

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ARCHIVOS_PERMITIDOS.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('comprobante', file)
      const result = await api.upload<{ nombre: string; url: string }>('/pagos/comprobantes', formData)
      setComprobanteNombre(result.nombre)
      setComprobanteUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  function quitarComprobante() {
    setComprobanteNombre('')
    setComprobanteUrl('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post(`/pagos/${pago!.id}/marcar-pagado`, {
        fechaPagoReal,
        metodoPago: metodoPago.trim() || undefined,
        numeroOperacion: numeroOperacion.trim() || undefined,
        comprobanteNombre: comprobanteUrl ? comprobanteNombre : undefined,
        comprobanteUrl: comprobanteUrl || undefined,
      })

      onOpenChange(false)
      if (onPagoCompletado) {
        onPagoCompletado(pago!.id)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como pagado')
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 motion-reduce:transition-none sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-5 pr-14">
          <SheetTitle className="text-lg font-semibold">Registrar Pago</SheetTitle>
          <SheetDescription className="mt-1 leading-5">
            Ingresa la constancia del desembolso para liquidar este compromiso.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {/* Card Resumen del Pago */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pago.ordenCompra ? `OC ${pago.ordenCompra.numero}` : 'Compromiso'}
                </span>
                <p className="truncate font-medium text-sm text-foreground">
                  {pago.concepto ?? pago.ordenCompra?.concepto ?? 'Pago'}
                </p>
              </div>
              <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">
                {fmtMoney(Number(pago.monto))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
              <div>
                <span className="text-muted-foreground block">Beneficiario:</span>
                <span className="font-medium text-foreground truncate block" title={beneficiario}>
                  {beneficiario}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Centro de Costo:</span>
                <span className="font-medium text-foreground truncate block">
                  {proyecto ? (proyecto.codigo ?? proyecto.nombre) : 'Administración'}
                </span>
              </div>

              {/* Destino de pago / Billetera o Banco */}
              {destino.esBilletera ? (
                <div className="col-span-2 pt-1">
                  <span className="text-muted-foreground block">Destino solicitado:</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground font-mono">
                    <Smartphone className="size-3 text-primary" />
                    [{destino.metodoLabel}] Cel: {destino.numero || 'Sin número registrado'}
                  </span>
                </div>
              ) : (destino.banco || destino.numero || destino.cci) ? (
                <div className="col-span-2 pt-1">
                  <span className="text-muted-foreground block">Cuenta destino:</span>
                  <span className="font-mono text-foreground">
                    {destino.bancoNorm && destino.bancoNorm !== 'Sin banco' ? `[${destino.bancoNorm}] ` : ''}
                    {destino.numero ? `${destino.numeroLabel}: ${destino.numero}` : ''}
                    {destino.cci ? ` · CCI: ${destino.cci}` : ''}
                  </span>
                </div>
              ) : (
                <div className="col-span-2 pt-1">
                  <span className="text-muted-foreground/60 italic">Sin cuenta o billetera registrada</span>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Pago */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Calendar className="size-3.5 text-muted-foreground" />
                Fecha de pago real
              </label>
              <Input
                type="date"
                required
                value={fechaPagoReal}
                onChange={(e) => setFechaPagoReal(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <CreditCard className="size-3.5 text-muted-foreground" />
                Método de pago ejecutado
              </label>
              <Input
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                list="metodos-sugeridos"
                placeholder="Ej. Yape, Plin, Transferencia BCP, Cheque, Efectivo..."
                className="h-9 text-sm"
                required
              />
              <datalist id="metodos-sugeridos">
                {METODOS_SUGERIDOS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                N° de operación / referencia (opcional)
              </label>
              <Input
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                placeholder="Ej. 18294812"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Comprobante / Voucher de pago (Yape, Plin o Transferencia)
              </label>
              {comprobanteUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border p-2.5 bg-background">
                  {comprobanteUrl.endsWith('.pdf') ? (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
                      PDF
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`${API_ORIGIN}${comprobanteUrl}`}
                      alt="Comprobante"
                      className="size-11 shrink-0 rounded object-cover border border-border"
                    />
                  )}
                  <span className="flex-1 truncate text-xs text-foreground font-medium">
                    {comprobanteNombre || 'Comprobante adjuntado'}
                  </span>
                  <button
                    type="button"
                    onClick={quitarComprobante}
                    title="Quitar comprobante"
                    className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground cursor-pointer hover:bg-muted/40 hover:border-primary/40 transition-colors">
                  {uploading ? (
                    <Upload className="size-5 animate-pulse text-primary" />
                  ) : (
                    <Upload className="size-5 text-muted-foreground/60" />
                  )}
                  <span className="font-medium text-foreground">
                    {uploading ? 'Subiendo archivo...' : 'Adjuntar voucher o captura de pago'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">JPG, PNG, WEBP o PDF hasta 10MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center gap-2">
            <Button type="submit" disabled={saving || uploading} className="flex-1">
              <Check className="size-4" />
              {saving ? 'Registrando...' : 'Confirmar pago'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving || uploading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
