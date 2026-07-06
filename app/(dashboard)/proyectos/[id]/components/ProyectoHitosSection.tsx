'use client'

import { useState } from 'react'
import { Plus, Trash2, Target, X, Check } from 'lucide-react'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrabajadorCombobox } from '@/components/ui/trabajador-combobox'
import type { Hito, CumplimientoHito, Trabajador } from '@/types/api'

interface Props {
  proyectoId: string
  initialHitos: Hito[]
  trabajadores: Trabajador[]
}

type FormState = {
  nombre: string
  fechaProgramada: string
  responsableId: string
  cumplimiento: CumplimientoHito
  notas: string
}

const CUMPLIMIENTO_STYLES: Record<CumplimientoHito, string> = {
  si: 'bg-chart-2/15 text-chart-2',
  no: 'bg-destructive/15 text-destructive',
  programado: 'bg-blue-500/15 text-blue-600',
}

const CUMPLIMIENTO_LABELS: Record<CumplimientoHito, string> = {
  si: 'Cumplido',
  no: 'No cumplido',
  programado: 'Programado',
}

function fmt(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProyectoHitosSection({ proyectoId, initialHitos, trabajadores }: Props) {
  const [hitos, setHitos] = useState<Hito[]>(initialHitos)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>({
    nombre: '',
    fechaProgramada: '',
    responsableId: '',
    cumplimiento: 'programado',
    notas: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  function resetForm() {
    setForm({ nombre: '', fechaProgramada: '', responsableId: '', cumplimiento: 'programado', notas: '' })
    setFormError(null)
    setShowForm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setFormError('El nombre es requerido'); return }
    if (!form.fechaProgramada) { setFormError('La fecha programada es requerida'); return }
    if (!form.responsableId) { setFormError('El responsable es requerido'); return }

    setSubmitting(true)
    setFormError(null)
    try {
      const hito = await api.post<Hito>(`/proyectos/${proyectoId}/hitos`, {
        nombre: form.nombre,
        fechaProgramada: form.fechaProgramada,
        responsableId: form.responsableId,
        cumplimiento: form.cumplimiento,
        ...(form.notas.trim() && { notas: form.notas }),
      })
      setHitos((prev) => [...prev, hito])
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear hito')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleCumplimiento(hito: Hito, value: CumplimientoHito) {
    try {
      await api.patch(`/proyectos/${proyectoId}/hitos/${hito.id}`, { cumplimiento: value })
      setHitos((prev) => prev.map((h) => h.id === hito.id ? { ...h, cumplimiento: value } : h))
    } catch {
      // silent fail, user can retry
    }
  }

  async function handleRemove(hito: Hito) {
    setRemoving(hito.id)
    try {
      await api.delete(`/proyectos/${proyectoId}/hitos/${hito.id}`)
      setHitos((prev) => prev.filter((h) => h.id !== hito.id))
      setConfirmId(null)
    } catch {
      // keep row
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hitos del proyecto ({hitos.length})
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Agregar hito
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-[150ms]"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nuevo hito</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.nombre}
                onChange={(e) => { setForm((f) => ({ ...f, nombre: e.target.value })); setFormError(null) }}
                placeholder="Ej. Entrega de planos"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Fecha programada <span className="text-destructive">*</span>
              </label>
              <DatePicker
                value={form.fechaProgramada}
                onValueChange={(v) => { setForm((f) => ({ ...f, fechaProgramada: v })); setFormError(null) }}
                placeholder="Seleccionar…"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Responsable <span className="text-destructive">*</span>
              </label>
              <TrabajadorCombobox
                trabajadores={trabajadores}
                value={form.responsableId}
                onValueChange={(v) => { setForm((f) => ({ ...f, responsableId: v })); setFormError(null) }}
                placeholder="Seleccionar…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Cumplimiento</label>
              <Select value={form.cumplimiento} onValueChange={(v) => v && setForm((f) => ({ ...f, cumplimiento: v as CumplimientoHito }))}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="si">Cumplido</SelectItem>
                  <SelectItem value="no">No cumplido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notas (opcional)</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              placeholder="Observaciones adicionales…"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms] resize-none"
            />
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <Button type="submit" size="sm" disabled={submitting} className="h-7 text-xs">
              {submitting ? 'Guardando…' : 'Agregar hito'}
            </Button>
          </div>
        </form>
      )}

      {hitos.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <Target className="size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Sin hitos registrados</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs text-primary hover:underline underline-offset-2"
          >
            Agregar el primero
          </button>
        </div>
      )}

      {hitos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Hito</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha prog.</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">Responsable</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Cumplimiento</th>
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hitos.map((hito) => (
                <tr
                  key={hito.id}
                  className={cn(
                    'transition-colors duration-[120ms]',
                    confirmId === hito.id ? 'bg-destructive/5' : 'hover:bg-muted/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{hito.nombre}</p>
                    {hito.notas && <p className="text-xs text-muted-foreground mt-0.5">{hito.notas}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {fmt(hito.fechaProgramada)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {hito.responsable?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={hito.cumplimiento}
                      onValueChange={(v) => v && handleToggleCumplimiento(hito, v as CumplimientoHito)}
                    >
                      <SelectTrigger className="h-7 w-auto border-none bg-transparent p-0 shadow-none">
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', CUMPLIMIENTO_STYLES[hito.cumplimiento])}>
                          {CUMPLIMIENTO_LABELS[hito.cumplimiento]}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programado">Programado</SelectItem>
                        <SelectItem value="si">Cumplido</SelectItem>
                        <SelectItem value="no">No cumplido</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-3">
                    {confirmId === hito.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRemove(hito)}
                          disabled={removing === hito.id}
                          className="rounded p-1 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          aria-label="Confirmar eliminación"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Cancelar"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(hito.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Eliminar hito"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
