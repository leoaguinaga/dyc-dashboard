'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Upload, X, Trash2 } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Pago } from '@/types/api'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ARCHIVOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function MarcarPagadoCard({ pago }: { pago: Pago }) {
  const router = useRouter()
  const [fechaPagoReal, setFechaPagoReal] = useState(hoyISO)
  const [metodoPago, setMetodoPago] = useState(pago.metodoPago ?? '')
  const [numeroOperacion, setNumeroOperacion] = useState('')
  const [comprobanteNombre, setComprobanteNombre] = useState(pago.comprobanteNombre ?? '')
  const [comprobanteUrl, setComprobanteUrl] = useState(pago.comprobanteUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function marcarPagado() {
    setSaving(true)
    setError(null)
    try {
      await api.post(`/pagos/${pago.id}/marcar-pagado`, {
        fechaPagoReal,
        metodoPago: metodoPago.trim() || undefined,
        numeroOperacion: numeroOperacion.trim() || undefined,
        comprobanteNombre: comprobanteUrl ? comprobanteNombre : undefined,
        comprobanteUrl: comprobanteUrl || undefined,
      })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al marcar como pagado')
      setSaving(false)
    }
  }

  async function cancelarPago() {
    setCancelando(true)
    setError(null)
    try {
      await api.post(`/pagos/${pago.id}/cancelar`, {})
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cancelar el pago')
      setCancelando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Marcar como pagado</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de pago</label>
          <Input type="date" value={fechaPagoReal} onChange={(e) => setFechaPagoReal(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Método de pago</label>
          <Input value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="h-9 text-sm" placeholder="Transferencia, efectivo…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">N° de operación</label>
          <Input value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} className="h-9 text-sm" placeholder="Opcional" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Factura o boleta (opcional)</label>
        {comprobanteUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
            {comprobanteUrl.endsWith('.pdf') ? (
              <div className="flex size-12 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">PDF</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_ORIGIN}${comprobanteUrl}`} alt="Comprobante" className="size-12 shrink-0 rounded object-cover border border-border" />
            )}
            <span className="flex-1 truncate text-sm">{comprobanteNombre || 'Comprobante'}</span>
            <button
              type="button"
              onClick={quitarComprobante}
              title="Quitar"
              className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
            {uploading ? <Upload className="size-4 animate-pulse" /> : <Upload className="size-4" />}
            {uploading ? 'Subiendo…' : 'Subir foto o PDF de la factura/boleta'}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={marcarPagado} disabled={saving || uploading || cancelando}>
          <Check className="size-3.5" />
          {saving ? 'Guardando…' : 'Marcar como pagado'}
        </Button>
        <Button variant="outline" onClick={cancelarPago} disabled={saving || uploading || cancelando}>
          <X className="size-3.5" />
          {cancelando ? 'Cancelando…' : 'Cancelar pago'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
