'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Lock,
  LockOpen,
  Truck,
  Receipt,
  FileSpreadsheet,
  Building2,
} from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Comprobante, TipoDocumentoComprobante } from '@/types/api'

const ARCHIVOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const TIPOS_DOCUMENTO: { value: TipoDocumentoComprobante; label: string }[] = [
  { value: 'factura', label: 'Factura' },
  { value: 'boleta', label: 'Boleta de venta' },
  { value: 'guia_remision', label: 'Guía de remisión' },
  { value: 'recibo', label: 'Recibo por honorarios' },
  { value: 'nota_credito', label: 'Nota de crédito' },
  { value: 'nota_debito', label: 'Nota de débito' },
  { value: 'voucher_deposito', label: 'Foto de transferencia / voucher' },
  { value: 'cotizacion_propia', label: 'Nuestra cotización' },
  { value: 'cotizacion_proveedor', label: 'Cotización del proveedor' },
  { value: 'otro', label: 'Otro documento' },
]

const TIPO_LABEL: Record<TipoDocumentoComprobante, string> = Object.fromEntries(
  TIPOS_DOCUMENTO.map((t) => [t.value, t.label]),
) as Record<TipoDocumentoComprobante, string>

/** Slots rápidos: documentos opcionales frecuentes que no requieren N° de comprobante ni importe. */
const SLOTS_RAPIDOS: { tipo: TipoDocumentoComprobante; label: string; icon: typeof Truck }[] = [
  { tipo: 'guia_remision', label: 'Guía de remisión', icon: Truck },
  { tipo: 'voucher_deposito', label: 'Foto de la transferencia', icon: Receipt },
  { tipo: 'cotizacion_propia', label: 'Nuestra cotización', icon: FileSpreadsheet },
  { tipo: 'cotizacion_proveedor', label: 'Cotización del proveedor', icon: Building2 },
]

interface Props {
  pagoId: string
  comprobantes: Comprobante[]
}

export function ComprobantePagoSection({ pagoId, comprobantes }: Props) {
  const router = useRouter()
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoComprobante>('factura')
  const [numero, setNumero] = useState('')
  const [importe, setImporte] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busySlot, setBusySlot] = useState<TipoDocumentoComprobante | null>(null)

  async function subirDocumento(input: {
    file: File
    tipoDocumento: TipoDocumentoComprobante
    numero: string
    importe?: number
  }) {
    const formData = new FormData()
    formData.append('archivo', input.file)
    formData.append('numero', input.numero)
    formData.append('tipoDocumento', input.tipoDocumento)
    if (input.importe !== undefined) formData.append('importe', String(input.importe))
    await api.upload(`/pagos/${pagoId}/comprobantes`, formData)
    router.refresh()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ARCHIVOS_PERMITIDOS.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.')
      return
    }
    setError(null)
    setPendingFile(file)
  }

  async function handleSubir() {
    if (!pendingFile) return
    if (!numero.trim()) {
      setError('Ingresa el N° de comprobante o documento.')
      return
    }
    const importeNum = Number(importe)
    if (!importe || Number.isNaN(importeNum) || importeNum <= 0) {
      setError('Ingresa el importe del documento.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      await subirDocumento({
        file: pendingFile,
        tipoDocumento,
        numero: numero.trim(),
        importe: importeNum,
      })
      setSuccess('Documento guardado con éxito.')
      setTimeout(() => setSuccess(null), 3000)
      setPendingFile(null)
      setNumero('')
      setImporte('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el documento')
    } finally {
      setUploading(false)
    }
  }

  async function handleSlotFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: TipoDocumentoComprobante,
  ) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ARCHIVOS_PERMITIDOS.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.')
      return
    }

    setBusySlot(tipo)
    setError(null)
    setSuccess(null)
    try {
      await subirDocumento({ file, tipoDocumento: tipo, numero: TIPO_LABEL[tipo] })
      setSuccess('Documento guardado con éxito.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el documento')
    } finally {
      setBusySlot(null)
    }
  }

  async function handleEliminar(comprobanteId: string) {
    if (!confirm('¿Estás seguro de quitar este documento?')) return

    setBusyId(comprobanteId)
    setError(null)
    try {
      await api.delete(`/pagos/${pagoId}/comprobantes/${comprobanteId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el documento')
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleEstado(comprobante: Comprobante) {
    setBusyId(comprobante.id)
    setError(null)
    try {
      await api.patch(`/pagos/${pagoId}/comprobantes/${comprobante.id}`, {
        estado: comprobante.estado === 'abierto' ? 'cerrado' : 'abierto',
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-xs">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sustento / Rendición de documentos
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adjunta cada comprobante (factura, boleta, guía de remisión, etc.) por separado.
        </p>
      </div>

      {/* Slots rápidos: documentos opcionales frecuentes */}
      <div className="grid grid-cols-2 gap-2">
        {SLOTS_RAPIDOS.map(({ tipo, label, icon: Icon }) => {
          const existentes = comprobantes.filter((c) => c.tipoDocumento === tipo)
          const ultimo = existentes[existentes.length - 1]
          const cargando = busySlot === tipo

          return (
            <div
              key={tipo}
              className="rounded-lg border border-border bg-muted/10 p-2.5 space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </div>

              {ultimo ? (
                <div className="flex items-center justify-between gap-1.5">
                  <a
                    href={`${API_ORIGIN}${ultimo.archivoUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline truncate min-w-0"
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate">Ver documento</span>
                  </a>
                  <label className="shrink-0 cursor-pointer">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border border-border bg-white px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors',
                        cargando && 'opacity-50 pointer-events-none',
                      )}
                    >
                      {cargando ? (
                        <RefreshCw className="size-3 animate-spin" />
                      ) : (
                        'Reemplazar'
                      )}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      disabled={cargando}
                      onChange={(e) => handleSlotFileSelect(e, tipo)}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-white py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                  {cargando ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="size-3.5" />
                      Subir
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={cargando}
                    onChange={(e) => handleSlotFileSelect(e, tipo)}
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>

      {/* Lista de documentos ya adjuntos */}
      {comprobantes.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border">
          {comprobantes.map((c) => {
            const esPdf = c.archivoUrl.toLowerCase().endsWith('.pdf')
            const esCerrado = c.estado === 'cerrado'
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {esPdf ? (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 font-bold text-[10px]">
                      PDF
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_ORIGIN}${c.archivoUrl}`}
                      alt={c.archivoNombre}
                      className="size-10 shrink-0 rounded-lg object-cover border border-border"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {TIPO_LABEL[c.tipoDocumento]}
                      </span>
                      <span className="font-mono text-xs font-medium text-foreground">
                        {c.numero}
                        {c.subNumero > 1 ? `.${c.subNumero}` : ''}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                          esCerrado
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-amber-500/10 text-amber-700',
                        )}
                      >
                        {esCerrado ? <Lock className="size-2.5" /> : <LockOpen className="size-2.5" />}
                        {esCerrado ? 'Cerrado' : 'Abierto'}
                      </span>
                    </div>
                    <span className="block truncate text-xs text-muted-foreground mt-0.5">
                      {c.archivoNombre}
                      {Number(c.importe) > 0 ? ` · S/ ${Number(c.importe).toFixed(2)}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <a
                    href={`${API_ORIGIN}${c.archivoUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEstado(c)}
                    disabled={busyId === c.id}
                    title={esCerrado ? 'Marcar como abierto' : 'Marcar como cerrado'}
                    className="h-8 text-xs"
                  >
                    {esCerrado ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminar(c.id)}
                    disabled={busyId === c.id}
                    title="Eliminar documento"
                    className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulario de nuevo documento (factura, boleta, etc. con N° e importe) */}
      <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">Tipo de documento</label>
            <Select
              value={tipoDocumento}
              onValueChange={(v) => setTipoDocumento(v as TipoDocumentoComprobante)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue className="normal-case" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">N° de comprobante</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej. 261777"
              className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-foreground block">Importe (S/)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder="0.00"
              className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
            />
          </div>
        </div>

        {pendingFile ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 text-primary shrink-0" />
              <span className="truncate text-xs font-medium text-foreground">{pendingFile.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Quitar
              </button>
              <Button
                size="sm"
                onClick={handleSubir}
                disabled={uploading}
                className="h-7 gap-1.5 text-xs"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  'Guardar documento'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/10 p-4 text-center cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors">
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              Haz clic o arrastra un archivo aquí
            </span>
            <span className="text-[11px] text-muted-foreground">
              JPG, PNG, WEBP o PDF (hasta 10 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        )}
      </div>

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
