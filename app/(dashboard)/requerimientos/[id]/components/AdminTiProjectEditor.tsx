'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Proyecto, Requerimiento } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
  proyectos: Proyecto[]
}

export function AdminTiProjectEditor({ requerimiento, proyectos }: Props) {
  const router = useRouter()
  const [proyectoId, setProyectoId] = useState(requerimiento.proyectoId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const proyectoDestino = proyectos.find((proyecto) => proyecto.id === proyectoId)
  const sinCambios = proyectoId === requerimiento.proyectoId

  async function cambiarProyecto() {
    if (sinCambios || !proyectoDestino) return

    const confirmado = window.confirm(
      `¿Cambiar el proyecto de “${requerimiento.proyecto.nombre}” a “${proyectoDestino.nombre}”?\n\n` +
        'El requerimiento y sus solicitudes, órdenes y pagos vinculados se alinearán al nuevo proyecto. La acción quedará registrada en el historial.',
    )
    if (!confirmado) return

    setSaving(true)
    setError(null)
    try {
      await api.patch(`/requerimientos/${requerimiento.id}`, { proyectoId })
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-amber-900">Cambiar proyecto · Administración TI</h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Disponible en cualquier estado. La corrección se propaga a los registros de compra
            vinculados para evitar proyectos contradictorios.
          </p>
        </div>
      </div>

      <Select value={proyectoId} onValueChange={(value) => setProyectoId(value ?? requerimiento.proyectoId)}>
        <SelectTrigger className="w-full bg-white" aria-label="Proyecto del requerimiento">
          <SelectValue placeholder="Selecciona un proyecto" />
        </SelectTrigger>
        <SelectContent>
          {proyectos.map((proyecto) => (
            <SelectItem key={proyecto.id} value={proyecto.id}>
              {proyecto.codigo ? `${proyecto.codigo} · ` : ''}{proyecto.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={sinCambios || !proyectoDestino || saving}
        onClick={cambiarProyecto}
      >
        {saving ? 'Actualizando proyecto…' : 'Cambiar proyecto'}
      </Button>
    </section>
  )
}
