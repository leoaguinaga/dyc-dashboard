'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, FileDown, CheckCircle2, Upload, Trash2 } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Proyecto } from '@/types/api'

interface Resumen {
  gastoTotal: number
  cantidadOrdenesCompra: number
  cantidadTrabajadores: number
}

interface Props {
  proyecto: Proyecto
}

const ARCHIVOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png']

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CierreObraSection({ proyecto }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)

  const [actaNombre, setActaNombre] = useState('')
  const [actaUrl, setActaUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fechaProgramada, setFechaProgramada] = useState<string | undefined>(undefined)
  const [monto, setMonto] = useState('')

  const role = session?.user?.role
  const canClose = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'
  const trabajadores = proyecto.trabajadores ?? []
  const estaCerrada = proyecto.estado === 'cierre' || proyecto.estado === 'liquidada'
  const puedeConfirmar = actaUrl && fechaProgramada && Number(monto) > 0

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ARCHIVOS_PERMITIDOS.includes(file.type)) {
      setError('Solo se permiten PDF, JPG o PNG')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      const result = await api.upload<{ nombre: string; url: string }>('/proyectos/acta-conformidad', formData)
      setActaNombre(result.nombre)
      setActaUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el acta de conformidad')
    } finally {
      setUploading(false)
    }
  }

  function quitarActa() {
    setActaNombre('')
    setActaUrl('')
  }

  async function handleCerrar() {
    if (!puedeConfirmar) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.patch<{ resumen: Resumen }>(`/proyectos/${proyecto.id}/cerrar`, {
        actaConformidadNombre: actaNombre,
        actaConformidadUrl: actaUrl,
        fechaProgramada,
        monto: Number(monto),
      })
      setResumen(result.resumen)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar la obra')
    } finally {
      setLoading(false)
    }
  }

  if (!canClose && !estaCerrada) return null

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Cierre de obra</h2>
        {canClose && proyecto.estado === 'ejecucion' && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Lock className="size-3.5" />
            Cerrar obra
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {resumen && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-chart-2/10 p-3 text-sm">
          <CheckCircle2 className="size-4 text-chart-2 shrink-0" />
          <span>
            Obra cerrada. Gasto total <span className="font-semibold">{fmtMoney(resumen.gastoTotal)}</span> en{' '}
            {resumen.cantidadOrdenesCompra} orden(es) de compra, {resumen.cantidadTrabajadores} trabajador(es) participantes.
          </span>
        </div>
      )}

      {estaCerrada && trabajadores.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Constancias de trabajo</p>
          <div className="flex flex-wrap gap-2">
            {trabajadores.map((t) => (
              <a
                key={t.id}
                href={`/api/proyectos/${proyecto.id}/trabajadores/${t.trabajadorId}/certificado`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground transition-colors duration-[120ms] hover:bg-muted"
              >
                <FileDown className="size-3.5" />
                {t.trabajador.nombre}
              </a>
            ))}
          </div>
        </div>
      )}

      {!estaCerrada && !canClose && (
        <p className="text-sm text-muted-foreground">Sin acciones disponibles.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar obra — pasar a Liquidación</DialogTitle>
            <DialogDescription>
              La obra pasa a estado Liquidación. Se bloquearán nuevos requerimientos y se generará un recordatorio
              de cobro. La operación falla si hay requerimientos, solicitudes de cotización u órdenes de compra en curso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Acta de conformidad</label>
              {actaUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                    {actaUrl.endsWith('.pdf') ? 'PDF' : 'IMG'}
                  </div>
                  <span className="flex-1 truncate text-sm">{actaNombre || 'Acta de conformidad'}</span>
                  <button
                    type="button"
                    onClick={quitarActa}
                    title="Quitar"
                    className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                  {uploading ? <Upload className="size-4 animate-pulse" /> : <Upload className="size-4" />}
                  {uploading ? 'Subiendo…' : 'Subir acta de conformidad (PDF, JPG, PNG)'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha programada de cobro</label>
                <DatePicker value={fechaProgramada} onValueChange={setFechaProgramada} className="w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Monto a cobrar (S/)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleCerrar} disabled={loading || uploading || !puedeConfirmar}>
              {loading ? 'Cerrando…' : 'Confirmar cierre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
