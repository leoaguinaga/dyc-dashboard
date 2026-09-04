'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Trash2, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

const ARCHIVOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

interface Props {
  pagoId: string
  comprobanteUrl?: string | null
  comprobanteNombre?: string | null
}

export function ComprobantePagoSection({
  pagoId,
  comprobanteUrl: urlInicial,
  comprobanteNombre: nombreInicial,
}: Props) {
  const router = useRouter()
  const [url, setUrl] = useState<string | null>(urlInicial ?? null)
  const [nombre, setNombre] = useState<string | null>(nombreInicial ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ARCHIVOS_PERMITIDOS.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Subir archivo a almacenamiento
      const formData = new FormData()
      formData.append('comprobante', file)
      const subida = await api.upload<{ nombre: string; url: string }>('/pagos/comprobantes', formData)

      // 2. Asociar el comprobante al pago
      await api.post(`/pagos/${pagoId}/comprobante`, {
        comprobanteNombre: subida.nombre,
        comprobanteUrl: subida.url,
      })

      setUrl(subida.url)
      setNombre(subida.nombre)
      setSuccess('Comprobante guardado con éxito.')
      setTimeout(() => setSuccess(null), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir comprobante')
    } finally {
      setUploading(false)
    }
  }

  async function handleEliminar() {
    if (!confirm('¿Estás seguro de quitar este comprobante?')) return

    setUploading(true)
    setError(null)
    try {
      await api.post(`/pagos/${pagoId}/comprobante`, {
        comprobanteNombre: '',
        comprobanteUrl: '',
      })
      setUrl(null)
      setNombre(null)
      setSuccess('Comprobante eliminado.')
      setTimeout(() => setSuccess(null), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar comprobante')
    } finally {
      setUploading(false)
    }
  }

  const esPdf = url?.toLowerCase().endsWith('.pdf')

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sustento / Comprobante
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Factura, boleta o constancia de desembolso bancario.
          </p>
        </div>
        {url && (
          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              className="h-8 gap-1.5 text-xs pointer-events-none"
            >
              <RefreshCw className={uploading ? 'size-3.5 animate-spin' : 'size-3.5'} />
              {uploading ? 'Subiendo...' : 'Cambiar comprobante'}
            </Button>
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

      {url ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-3 min-w-0">
              {esPdf ? (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 font-bold text-xs">
                  PDF
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`${API_ORIGIN}${url}`}
                  alt="Comprobante de pago"
                  className="size-12 shrink-0 rounded-lg object-cover border border-border"
                />
              )}
              <div className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {nombre || 'Comprobante adjunto'}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {esPdf ? 'Documento PDF' : 'Archivo de imagen'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`${API_ORIGIN}${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
              >
                <ExternalLink className="size-3.5" />
                Ver documento completo
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEliminar}
                disabled={uploading}
                title="Eliminar comprobante"
                className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {!esPdf && (
            <div className="overflow-hidden rounded-lg border border-border bg-muted/10 p-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_ORIGIN}${url}`}
                alt="Vista previa del comprobante"
                className="max-h-80 w-auto rounded object-contain shadow-xs"
              />
            </div>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {uploading ? (
              <RefreshCw className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {uploading ? 'Subiendo comprobante...' : 'Haz clic o arrastra un comprobante aquí'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Formatos soportados: JPG, PNG, WEBP o PDF (hasta 10 MB)
            </p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {success && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2">
          <CheckCircle2 className="size-3.5" />
          {success}
        </div>
      )}
    </div>
  )
}
