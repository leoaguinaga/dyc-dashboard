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
  Receipt,
  Building2,
  Plus,
} from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Comprobante, TipoDocumentoComprobante } from '@/types/api'

const ARCHIVOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const TIPO_LABEL: Record<TipoDocumentoComprobante, string> = {
  factura: 'Factura',
  boleta: 'Boleta de venta',
  guia_remision: 'Guía de remisión',
  recibo: 'Recibo por honorarios',
  nota_credito: 'Nota de crédito',
  nota_debito: 'Nota de débito',
  voucher_deposito: 'Foto de la transferencia',
  cotizacion_propia: 'Nuestra cotización',
  cotizacion_proveedor: 'Cotización del proveedor',
  otro: 'Otro documento',
}

/** Slots obligatorios: se piden siempre para sustentar el pago. */
const SLOTS_OBLIGATORIOS: { tipo: TipoDocumentoComprobante; label: string; icon: typeof Receipt }[] = [
  { tipo: 'voucher_deposito', label: 'Foto de la transferencia', icon: Receipt },
  { tipo: 'cotizacion_proveedor', label: 'Cotización del proveedor', icon: Building2 },
]

interface FilaDocumento {
  id: string
  nombre: string
  descripcion: string
  monto: string
  file: File | null
}

function nuevaFila(): FilaDocumento {
  return { id: crypto.randomUUID(), nombre: '', descripcion: '', monto: '', file: null }
}

interface Props {
  pagoId: string
  comprobantes: Comprobante[]
}

export function ComprobantePagoSection({ pagoId, comprobantes }: Props) {
  const router = useRouter()

  // Factura: obligatoria, con N° de comprobante e importe.
  const [facturaNumero, setFacturaNumero] = useState('')
  const [facturaImporte, setFacturaImporte] = useState('')
  const [facturaFile, setFacturaFile] = useState<File | null>(null)
  const [facturaUploading, setFacturaUploading] = useState(false)

  // Foto de la transferencia y Cotización del proveedor: subida simple.
  const [busySlot, setBusySlot] = useState<TipoDocumentoComprobante | null>(null)

  // Documentos adicionales: nombre + descripción + monto opcional + archivo.
  const [filas, setFilas] = useState<FilaDocumento[]>([])
  const [guardandoFilas, setGuardandoFilas] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function mostrarExito(mensaje: string) {
    setSuccess(mensaje)
    setTimeout(() => setSuccess(null), 3000)
  }

  function validarArchivo(file: File) {
    if (!ARCHIVOS_PERMITIDOS.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.')
      return false
    }
    return true
  }

  async function subirDocumento(input: {
    file: File
    tipoDocumento: TipoDocumentoComprobante
    numero: string
    importe?: number
    detalleGasto?: string
  }) {
    const formData = new FormData()
    formData.append('archivo', input.file)
    formData.append('numero', input.numero)
    formData.append('tipoDocumento', input.tipoDocumento)
    if (input.importe !== undefined) formData.append('importe', String(input.importe))
    if (input.detalleGasto) formData.append('detalleGasto', input.detalleGasto)
    await api.upload(`/pagos/${pagoId}/comprobantes`, formData)
  }

  function handleFacturaFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !validarArchivo(file)) return
    setError(null)
    setFacturaFile(file)
  }

  async function handleGuardarFactura() {
    if (!facturaFile) return
    if (!facturaNumero.trim()) {
      setError('Ingresa el N° de comprobante de la factura.')
      return
    }
    const importeNum = Number(facturaImporte)
    if (!facturaImporte || Number.isNaN(importeNum) || importeNum <= 0) {
      setError('Ingresa el importe de la factura.')
      return
    }

    setFacturaUploading(true)
    setError(null)
    setSuccess(null)
    try {
      await subirDocumento({
        file: facturaFile,
        tipoDocumento: 'factura',
        numero: facturaNumero.trim(),
        importe: importeNum,
      })
      mostrarExito('Documento guardado con éxito.')
      setFacturaFile(null)
      setFacturaNumero('')
      setFacturaImporte('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el documento')
    } finally {
      setFacturaUploading(false)
    }
  }

  async function handleSlotFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: TipoDocumentoComprobante,
  ) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !validarArchivo(file)) return

    setBusySlot(tipo)
    setError(null)
    setSuccess(null)
    try {
      await subirDocumento({ file, tipoDocumento: tipo, numero: TIPO_LABEL[tipo] })
      mostrarExito('Documento guardado con éxito.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el documento')
    } finally {
      setBusySlot(null)
    }
  }

  function agregarFila() {
    setFilas((prev) => [...prev, nuevaFila()])
  }

  function actualizarFila(id: string, patch: Partial<FilaDocumento>) {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function quitarFila(id: string) {
    setFilas((prev) => prev.filter((f) => f.id !== id))
  }

  function handleFilaFileSelect(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !validarArchivo(file)) return
    setError(null)
    actualizarFila(id, { file })
  }

  async function handleGuardarFilas() {
    if (filas.length === 0) return

    for (const fila of filas) {
      if (!fila.nombre.trim()) {
        setError('Cada documento necesita un nombre.')
        return
      }
      if (!fila.file) {
        setError(`Adjunta un archivo para "${fila.nombre.trim()}".`)
        return
      }
      if (fila.monto && Number.isNaN(Number(fila.monto))) {
        setError(`El monto de "${fila.nombre.trim()}" no es válido.`)
        return
      }
    }

    setGuardandoFilas(true)
    setError(null)
    setSuccess(null)
    try {
      for (const fila of filas) {
        await subirDocumento({
          file: fila.file!,
          tipoDocumento: 'otro',
          numero: fila.nombre.trim(),
          importe: fila.monto ? Number(fila.monto) : undefined,
          detalleGasto: fila.descripcion.trim() || undefined,
        })
      }
      mostrarExito(filas.length > 1 ? 'Documentos guardados con éxito.' : 'Documento guardado con éxito.')
      setFilas([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir los documentos')
    } finally {
      setGuardandoFilas(false)
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

  const facturaAdjuntada = comprobantes.some((c) => c.tipoDocumento === 'factura')

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-xs">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sustento / Rendición de documentos
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adjunta los 3 documentos obligatorios; agrega cualquier otro documento de sustento aparte.
        </p>
      </div>

      {/* Documentos obligatorios */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Documentos obligatorios
        </p>

        {/* Factura: requiere N° de comprobante e importe */}
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <FileText className="size-3.5 shrink-0" />
              <span>Factura</span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                facturaAdjuntada ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700',
              )}
            >
              {facturaAdjuntada ? 'Adjuntada' : 'Pendiente'}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground block">N° de comprobante</label>
              <input
                type="text"
                value={facturaNumero}
                onChange={(e) => setFacturaNumero(e.target.value)}
                placeholder="Ej. FPP1-002744"
                className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground block">Importe (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={facturaImporte}
                onChange={(e) => setFacturaImporte(e.target.value)}
                placeholder="0.00"
                className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
              />
            </div>
          </div>

          {facturaFile ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-4 text-primary shrink-0" />
                <span className="truncate text-xs font-medium text-foreground">{facturaFile.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFacturaFile(null)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Quitar
                </button>
                <Button
                  size="sm"
                  onClick={handleGuardarFactura}
                  disabled={facturaUploading}
                  className="h-7 gap-1.5 text-xs"
                >
                  {facturaUploading ? (
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
            <label className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-white py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
              <Upload className="size-3.5" />
              Subir archivo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFacturaFileSelect}
              />
            </label>
          )}
        </div>

        {/* Foto de la transferencia / Cotización del proveedor: subida simple */}
        <div className="grid grid-cols-2 gap-2">
          {SLOTS_OBLIGATORIOS.map(({ tipo, label, icon: Icon }) => {
            const existentes = comprobantes.filter((c) => c.tipoDocumento === tipo)
            const ultimo = existentes[existentes.length - 1]
            const cargando = busySlot === tipo

            return (
              <div
                key={tipo}
                className="rounded-lg border border-border bg-muted/10 p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground min-w-0">
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                      ultimo ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700',
                    )}
                  >
                    {ultimo ? 'Adjuntado' : 'Pendiente'}
                  </span>
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
                      {c.detalleGasto ? ` · ${c.detalleGasto}` : ''}
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

      {/* Documentos adicionales: nombre + descripción + monto opcional + archivo */}
      <div className="space-y-2 pt-1 border-t border-border">
        <div className="pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Documentos adicionales
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Guía de remisión, cotización propia u otro documento de sustento. Puedes agregar varios antes de guardar.
          </p>
        </div>

        {filas.map((fila) => (
          <div key={fila.id} className="rounded-xl border-2 border-dashed border-border p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">Nombre</label>
                <input
                  type="text"
                  value={fila.nombre}
                  onChange={(e) => actualizarFila(fila.id, { nombre: e.target.value })}
                  placeholder="Ej. Guía de remisión"
                  className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground block">
                  Monto (S/) <span className="text-muted-foreground/60 font-normal">opcional</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fila.monto}
                  onChange={(e) => actualizarFila(fila.id, { monto: e.target.value })}
                  placeholder="0.00"
                  className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-foreground block">
                  Descripción <span className="text-muted-foreground/60 font-normal">opcional</span>
                </label>
                <input
                  type="text"
                  value={fila.descripcion}
                  onChange={(e) => actualizarFila(fila.id, { descripcion: e.target.value })}
                  placeholder="Detalle del documento"
                  className="h-8 w-full rounded-lg border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
                />
              </div>
            </div>

            {fila.file ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="truncate text-xs font-medium text-foreground">{fila.file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => actualizarFila(fila.id, { file: null })}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-white py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <Upload className="size-3.5" />
                Subir archivo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFilaFileSelect(fila.id, e)}
                />
              </label>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => quitarFila(fila.id)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3.5" />
                Quitar documento
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarFila}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Agregar documento
          </Button>
          {filas.length > 0 && (
            <Button
              size="sm"
              onClick={handleGuardarFilas}
              disabled={guardandoFilas}
              className="h-8 gap-1.5 text-xs"
            >
              {guardandoFilas ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                `Guardar${filas.length > 1 ? ` (${filas.length})` : ''}`
              )}
            </Button>
          )}
        </div>
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
