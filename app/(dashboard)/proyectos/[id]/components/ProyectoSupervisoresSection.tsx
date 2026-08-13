'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, UserCog, X, Check } from 'lucide-react'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Proyecto, User } from '@/types/api'

type SupervisorItem = NonNullable<Proyecto['supervisores']>[number]

const ROLE_LABELS: Record<string, string> = {
  supervisor: 'Supervisor',
  supervisor_civil: 'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr: 'PDR',
  ing_civil: 'Ing. Civil',
  ing_electrico: 'Ing. Eléctrico',
  jefe_sig: 'Jefe SIG',
  logistica: 'Logística',
  gerencia: 'Gerencia',
  administrador: 'Administrador',
}

interface Props {
  proyectoId: string
  initialItems: SupervisorItem[]
  usuarios: User[]
}

export function ProyectoSupervisoresSection({ proyectoId, initialItems, usuarios }: Props) {
  const [items, setItems] = useState<SupervisorItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const assignedIds = new Set(items.map((i) => i.userId))
  const disponibles = usuarios.filter((u) => !assignedIds.has(u.id))

  function resetForm() {
    setSelectedUserId('')
    setFormError(null)
    setShowForm(false)
  }

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId) { setFormError('Selecciona un usuario'); return }

    setSubmitting(true)
    setFormError(null)
    try {
      await api.post(`/proyectos/${proyectoId}/supervisores/${selectedUserId}`, {})
      const user = usuarios.find((u) => u.id === selectedUserId)
      if (user) {
        setItems((prev) => [...prev, { userId: user.id, user: { id: user.id, name: user.name, email: user.email } }])
      }
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al asignar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(item: SupervisorItem) {
    setRemoving(item.userId)
    try {
      await api.delete(`/proyectos/${proyectoId}/supervisores/${item.userId}`)
      setItems((prev) => prev.filter((i) => i.userId !== item.userId))
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
          Supervisores del proyecto ({items.length})
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
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Usuario</label>
              <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v ?? ''); setFormError(null) }}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={disponibles.length === 0 ? 'Todos asignados' : 'Seleccionar...'} />
                </SelectTrigger>
                <SelectContent>
                  {disponibles.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} · {ROLE_LABELS[u.role] ?? u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Asignando...' : 'Confirmar asignación'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <UserCog className="size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Sin supervisores asignados</p>
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
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Usuario</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">Email</th>
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr
                  key={item.userId}
                  className={cn(
                    'transition-colors duration-[120ms]',
                    confirmId === item.userId ? 'bg-destructive/5' : 'hover:bg-muted/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/usuarios/${item.user.id}`}
                      className="font-medium hover:underline underline-offset-2"
                    >
                      {item.user.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {item.user.email}
                  </td>
                  <td className="px-2 py-3">
                    {confirmId === item.userId ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          disabled={removing === item.userId}
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
                        onClick={() => setConfirmId(item.userId)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Quitar supervisor"
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
