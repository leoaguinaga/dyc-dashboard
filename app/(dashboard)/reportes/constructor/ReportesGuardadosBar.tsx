'use client'

import { useEffect, useState } from 'react'
import { Save, Trash2, Users } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { QueryReporteDinamico, ReporteGuardado } from '@/lib/reportes/tipos'

interface Props {
  /** Consulta actual del constructor; undefined si todavía no hay entidad. */
  query?: QueryReporteDinamico
  onCargar: (query: QueryReporteDinamico) => void
}

type Modo = 'nuevo' | 'editar'

/** Guarda la consulta del constructor y la vuelve a cargar después (sub-fase 5.3). */
export function ReportesGuardadosBar({ query, onCargar }: Props) {
  const { data: session } = useSession()
  const [reportes, setReportes] = useState<ReporteGuardado[]>([])
  const [actualId, setActualId] = useState<string | null>(null)
  const [dialogo, setDialogo] = useState<Modo | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [compartido, setCompartido] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<ReporteGuardado[]>('/reportes/guardados').then(setReportes).catch(() => setReportes([]))
  }, [])

  const actual = reportes.find((r) => r.id === actualId) ?? null
  const esPropio = actual !== null && actual.creadoPorId === session?.user?.id

  function seleccionar(id: string) {
    const reporte = reportes.find((r) => r.id === id)
    if (!reporte) return
    setActualId(id)
    onCargar(reporte.query)
  }

  function abrir(modo: Modo) {
    setError(null)
    setNombre(modo === 'editar' && actual ? actual.nombre : '')
    setDescripcion(modo === 'editar' && actual ? (actual.descripcion ?? '') : '')
    setCompartido(modo === 'editar' && actual ? actual.compartido : false)
    setDialogo(modo)
  }

  async function guardar() {
    if (!query) return
    if (!nombre.trim()) {
      setError('Ponle un nombre al reporte')
      return
    }
    setGuardando(true)
    setError(null)
    const body = { nombre, descripcion, compartido, query }
    try {
      const guardado =
        dialogo === 'editar' && actual
          ? await api.patch<ReporteGuardado>(`/reportes/guardados/${actual.id}`, body)
          : await api.post<ReporteGuardado>('/reportes/guardados', body)
      setReportes((prev) =>
        [...prev.filter((r) => r.id !== guardado.id), guardado].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      )
      setActualId(guardado.id)
      setDialogo(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el reporte')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!actual) return
    setGuardando(true)
    try {
      await api.delete(`/reportes/guardados/${actual.id}`)
      setReportes((prev) => prev.filter((r) => r.id !== actual.id))
      setActualId(null)
      setConfirmarEliminar(false)
    } finally {
      setGuardando(false)
    }
  }

  const items = Object.fromEntries(reportes.map((r) => [r.id, r.nombre]))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select items={items} value={actualId} onValueChange={(v) => v && seleccionar(v as string)}>
        <SelectTrigger className="w-64 normal-case" aria-label="Reportes guardados">
          <SelectValue placeholder={reportes.length ? 'Abrir un reporte guardado' : 'Sin reportes guardados'} className="normal-case" />
        </SelectTrigger>
        <SelectContent>
          {reportes.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              <span className="flex items-center gap-1.5">
                {r.nombre}
                {r.creadoPorId !== session?.user?.id && (
                  <span className="text-xs text-muted-foreground">· {r.creadoPor.name}</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" size="sm" disabled={!query} onClick={() => abrir('nuevo')}>
        <Save className="size-3.5" />
        Guardar como…
      </Button>
      {esPropio && (
        <>
          <Button type="button" variant="outline" size="sm" disabled={!query} onClick={() => abrir('editar')}>
            Guardar cambios
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmarEliminar(true)} aria-label="Eliminar reporte guardado">
            <Trash2 className="size-3.5" />
          </Button>
        </>
      )}
      {actual?.compartido && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          Compartido
        </span>
      )}

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && !guardando && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogo === 'editar' ? 'Guardar cambios del reporte' : 'Guardar reporte'}</DialogTitle>
            <DialogDescription>Se guardan la entidad, los filtros, la agrupación y las métricas actuales.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="reporte-nombre" className="mb-1.5 block text-sm font-medium">Nombre</label>
              <Input id="reporte-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Pagos pendientes por obra" maxLength={120} />
            </div>
            <div>
              <label htmlFor="reporte-descripcion" className="mb-1.5 block text-sm font-medium">Descripción (opcional)</label>
              <Textarea id="reporte-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} maxLength={500} className="min-h-16" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="reporte-compartido" checked={compartido} onCheckedChange={setCompartido} size="sm" />
              <label htmlFor="reporte-compartido" className="text-sm">Compartir con quienes tienen acceso a Reportes</label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogo(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmarEliminar}
        onOpenChange={setConfirmarEliminar}
        title="Eliminar reporte guardado"
        description={actual ? `"${actual.nombre}" dejará de estar disponible${actual.compartido ? ' para todos' : ''}.` : undefined}
        confirmLabel="Eliminar"
        destructive
        loading={guardando}
        onConfirm={eliminar}
      />
    </div>
  )
}
