'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, HardHat, X, Check } from 'lucide-react'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { TrabajadorCombobox } from '@/components/ui/trabajador-combobox'
import type { Proyecto, Trabajador } from '@/types/api'

type AsigItem = NonNullable<Proyecto['trabajadores']>[number]

interface Props {
  proyectoId: string
  initialItems: AsigItem[]
  todos: Trabajador[]
}

type FormState = {
  trabajadorId: string
  fechaIngreso: string
  fechaSalida: string
}

function fmt(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProyectoTrabajadoresSection({ proyectoId, initialItems, todos }: Props) {
  const [items, setItems] = useState<AsigItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>({ trabajadorId: '', fechaIngreso: '', fechaSalida: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const assignedIds = new Set(items.map((i) => i.trabajadorId))
  const disponibles = todos.filter((t) => !assignedIds.has(t.id))

  function resetForm() {
    setForm({ trabajadorId: '', fechaIngreso: '', fechaSalida: '' })
    setFormError(null)
    setShowForm(false)
  }

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.trabajadorId) { setFormError('Selecciona un trabajador'); return }
    if (!form.fechaIngreso) { setFormError('La fecha de ingreso es requerida'); return }

    setSubmitting(true)
    setFormError(null)
    try {
      await api.post(`/trabajadores/${form.trabajadorId}/proyectos`, {
        proyectoId,
        fechaIngreso: form.fechaIngreso,
        ...(form.fechaSalida && { fechaSalida: form.fechaSalida }),
      })

      const trabajador = todos.find((t) => t.id === form.trabajadorId)!
      const newItem: AsigItem = {
        id: crypto.randomUUID(),
        trabajadorId: form.trabajadorId,
        fechaIngreso: form.fechaIngreso,
        fechaSalida: form.fechaSalida || undefined,
        trabajador: { id: trabajador.id, nombre: trabajador.nombre, cargo: trabajador.cargo, dni: trabajador.dni },
      }
      setItems((prev) => [...prev, newItem])
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al asignar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(asig: AsigItem) {
    setRemoving(asig.id)
    try {
      await api.delete(`/trabajadores/${asig.trabajadorId}/proyectos/${proyectoId}`)
      setItems((prev) => prev.filter((i) => i.id !== asig.id))
      setConfirmId(null)
    } catch {
      // keep row, show nothing (user can retry)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Trabajadores en proyecto ({items.length})
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Asignar
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleAsignar}
          className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asignar trabajador</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Trabajador</label>
              <TrabajadorCombobox
                trabajadores={disponibles}
                value={form.trabajadorId}
                onValueChange={(v) => {
                  setForm((f) => ({ ...f, trabajadorId: v }))
                  setFormError(null)
                }}
                placeholder={disponibles.length === 0 ? 'Todos asignados' : 'Seleccionar...'}
                disabled={disponibles.length === 0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Fecha de ingreso <span className="text-destructive">*</span>
              </label>
              <DatePicker
                value={form.fechaIngreso}
                onValueChange={(v) => {
                  setForm((f) => ({ ...f, fechaIngreso: v }))
                  setFormError(null)
                }}
                placeholder="Seleccionar..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Fecha de salida
              </label>
              <DatePicker
                value={form.fechaSalida}
                onValueChange={(v) => setForm((f) => ({ ...f, fechaSalida: v }))}
                placeholder="Opcional"
                className="h-9"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-destructive">{formError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <Button type="submit" size="sm" disabled={submitting} className="h-7 text-xs">
              {submitting ? 'Asignando...' : 'Confirmar asignacion'}
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <HardHat className="size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Sin trabajadores asignados</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs text-primary hover:underline underline-offset-2"
          >
            Asignar el primero
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Trabajador</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">Cargo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingreso</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Salida</th>
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((asig) => (
                <tr
                  key={asig.id}
                  className={cn(
                    'transition-colors duration-[120ms]',
                    confirmId === asig.id ? 'bg-destructive/5' : 'hover:bg-muted/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/trabajadores/${asig.trabajador.id}`}
                      className="font-medium hover:underline underline-offset-2"
                    >
                      {asig.trabajador.nombre}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{asig.trabajador.dni}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {asig.trabajador.cargo ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {fmt(asig.fechaIngreso)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums">
                    {asig.fechaSalida
                      ? <span className="text-muted-foreground">{fmt(asig.fechaSalida)}</span>
                      : <span className="text-chart-2">Activo</span>}
                  </td>
                  <td className="px-2 py-3">
                    {confirmId === asig.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRemove(asig)}
                          disabled={removing === asig.id}
                          className="rounded p-1 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          aria-label="Confirmar eliminacion"
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
                        onClick={() => setConfirmId(asig.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Quitar trabajador"
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
