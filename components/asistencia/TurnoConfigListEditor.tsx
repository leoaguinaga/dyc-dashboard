'use client'

import { useState } from 'react'
import { PencilIcon, PlusIcon, PowerIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { TurnoConfig } from '@/types/api'

interface Props {
  proyectoId: string
  initial: TurnoConfig[]
}

type FormState = {
  nombre: string
  horaInicio: string
  horaFin: string
  toleranciaMinutos: string
  toleranciaSalidaMinutos: string
}

const FORM_VACIO: FormState = {
  nombre: '',
  horaInicio: '',
  horaFin: '',
  toleranciaMinutos: '10',
  toleranciaSalidaMinutos: '60',
}

function aFormState(c: TurnoConfig): FormState {
  return {
    nombre: c.nombre,
    horaInicio: c.horaInicio,
    horaFin: c.horaFin,
    toleranciaMinutos: String(c.toleranciaMinutos),
    toleranciaSalidaMinutos: String(c.toleranciaSalidaMinutos),
  }
}

export function TurnoConfigListEditor({ proyectoId, initial }: Props) {
  const [turnos, setTurnos] = useState<TurnoConfig[]>(initial)
  const [editando, setEditando] = useState<TurnoConfig | null>(null)
  const [creando, setCreando] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function abrirCrear() {
    setForm(FORM_VACIO)
    setError(null)
    setCreando(true)
  }

  function abrirEditar(c: TurnoConfig) {
    setForm(aFormState(c))
    setError(null)
    setEditando(c)
  }

  function cerrarDialogo() {
    setCreando(false)
    setEditando(null)
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!form.horaInicio || !form.horaFin) {
      setError('Hora de inicio y fin son requeridas')
      return
    }

    setGuardando(true)
    setError(null)
    const payload = {
      nombre: form.nombre.trim(),
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      toleranciaMinutos: Number(form.toleranciaMinutos) || 0,
      toleranciaSalidaMinutos: Number(form.toleranciaSalidaMinutos) || 0,
    }

    try {
      if (editando) {
        const actualizado = await api.patch<TurnoConfig>(
          `/asistencias/proyectos/${proyectoId}/turno-configs/${editando.id}`,
          payload,
        )
        setTurnos((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)))
      } else {
        const creado = await api.post<TurnoConfig>(
          `/asistencias/proyectos/${proyectoId}/turno-configs`,
          payload,
        )
        setTurnos((prev) => [...prev, creado])
      }
      cerrarDialogo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el turno')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(c: TurnoConfig) {
    try {
      const actualizado = c.activo
        ? await api.delete<TurnoConfig>(`/asistencias/proyectos/${proyectoId}/turno-configs/${c.id}`)
        : await api.patch<TurnoConfig>(`/asistencias/proyectos/${proyectoId}/turno-configs/${c.id}`, { activo: true })
      setTurnos((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)))
    } catch {
      // acción secundaria — si falla, el estado visible simplemente no cambia
    }
  }

  const dialogAbierto = creando || editando !== null

  return (
    <div className="space-y-3">
      {turnos.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Esta obra todavía no tiene turnos de horario configurados. Agrega al menos uno para poder tomar asistencia.
        </p>
      )}

      {turnos.length > 0 && (
        <div className="space-y-2">
          {turnos.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-3 rounded-lg border border-border p-3 ${!c.activo ? 'opacity-50' : ''}`}
            >
              <div>
                <p className="text-sm font-medium">
                  {c.nombre}
                  {!c.activo && <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {c.horaInicio}–{c.horaFin}
                  {c.cruzaMedianoche && ' (cruza medianoche)'} · tolerancia entrada {c.toleranciaMinutos}min · tolerancia salida {c.toleranciaSalidaMinutos}min
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => abrirEditar(c)} className="gap-1.5">
                  <PencilIcon className="size-3.5" />
                  Editar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => toggleActivo(c)} className="gap-1.5">
                  <PowerIcon className="size-3.5" />
                  {c.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" onClick={abrirCrear} className="gap-1.5">
        <PlusIcon className="size-3.5" />
        Agregar turno
      </Button>

      <Dialog open={dialogAbierto} onOpenChange={(open) => !open && cerrarDialogo()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar turno' : 'Nuevo turno de horario'}</DialogTitle>
            <DialogDescription>
              Ej. &quot;Mañana&quot; 07:00–15:00, o &quot;Noche&quot; 22:00–06:00 (cruza medianoche automáticamente).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nombre</label>
              <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej. Mañana" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Hora de inicio</label>
                <TimePicker value={form.horaInicio} onValueChange={(v) => set('horaInicio', v)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Hora de fin</label>
                <TimePicker value={form.horaFin} onValueChange={(v) => set('horaFin', v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tolerancia entrada (min)</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.toleranciaMinutos}
                  onChange={(e) => set('toleranciaMinutos', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tolerancia salida (min)</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.toleranciaSalidaMinutos}
                  onChange={(e) => set('toleranciaSalidaMinutos', e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialogo} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
