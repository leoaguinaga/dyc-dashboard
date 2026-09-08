'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ShieldAlert } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import type { Proyecto, Requerimiento } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
  proyectos: Proyecto[]
}

const ROLES_SOLICITANTE = ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr']

export function AdminTiProjectEditor({ requerimiento, proyectos }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const esCreador = requerimiento.creadoPorId === session?.user?.id
  const esSolicitante = esCreador || (role ? ROLES_SOLICITANTE.includes(role) : false)

  const router = useRouter()
  const [proyectoId, setProyectoId] = useState(requerimiento.proyectoId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const proyectoDestino = proyectos.find((proyecto) => proyecto.id === proyectoId)
  const sinCambios = proyectoId === requerimiento.proyectoId

  async function cambiarProyecto() {
    if (sinCambios || !proyectoDestino) return

    const confirmado = window.confirm(
      `¿Cambiar la obra de “${requerimiento.proyecto.nombre}” a “${proyectoDestino.nombre}”?\n\n` +
        'El requerimiento y sus registros vinculados se alinearán a la nueva obra. La acción quedará registrada en el historial.',
    )
    if (!confirmado) return

    setSaving(true)
    setError(null)
    try {
      await api.patch(`/requerimientos/${requerimiento.id}`, { proyectoId })
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar la obra')
    } finally {
      setSaving(false)
    }
  }

  const titulo = role === 'admin_ti'
    ? 'Cambiar obra · Admin TI'
    : esSolicitante
      ? 'Cambiar obra · Solicitante'
      : 'Cambiar obra asignada'

  const descripcion = role === 'admin_ti'
    ? 'Disponible antes de cotización. La corrección queda registrada en el historial.'
    : esSolicitante
      ? 'Disponible mientras el requerimiento no esté aprobado. El cambio queda registrado en el historial.'
      : 'Disponible antes de que el requerimiento entre a cotización. El cambio queda registrado en el historial.'

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        {role === 'admin_ti' ? (
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
        ) : (
          <Building2 className="mt-0.5 size-4 shrink-0 text-amber-700" />
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-amber-900">{titulo}</h2>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            {descripcion}
          </p>
        </div>
      </div>

      <Select value={proyectoId} onValueChange={(value) => setProyectoId(value ?? requerimiento.proyectoId)}>
        <SelectTrigger className="w-full bg-white" aria-label="Proyecto del requerimiento">
          <SelectValue className="normal-case">
            {(value: string | null) => {
              const p = proyectos.find((proj) => proj.id === value)
              if (!p) return 'Selecciona un proyecto…'
              return `${p.codigo ? `${p.codigo} · ` : ''}${p.nombre}`
            }}
          </SelectValue>
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
        {saving ? 'Actualizando obra…' : 'Cambiar obra'}
      </Button>
    </section>
  )
}

export const RequerimientoObraEditor = AdminTiProjectEditor
