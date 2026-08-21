'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import type { HelpVideo, Role } from '@/types/api'
import { NAV_GROUPS } from '../../components/routes-config'
import { extractYoutubeId } from './youtube'

const ROLE_LABELS: Record<Role, string> = {
  supervisor: 'Supervisor',
  supervisor_civil: 'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr: 'PDR (Seguridad)',
  ing_civil: 'Ing. Civil',
  ing_electrico: 'Ing. Eléctrico',
  jefe_sig: 'Jefe SIG',
  logistica: 'Logística',
  gerencia: 'Gerencia',
  administrador: 'Administrador',
  admin_ti: 'Admin TI',
}

const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[]
const MODULOS = [...new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.label)))]

const labelCn = 'mb-1.5 block text-sm font-medium'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  video: HelpVideo | null
  onSaved: () => void
}

export function VideoFormDialog({ open, onOpenChange, video, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? 'Editar video' : 'Subir video'}</DialogTitle>
        </DialogHeader>
        {open && (
          <VideoForm
            video={video}
            onSaved={onSaved}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function VideoForm({
  video,
  onSaved,
  onCancel,
}: {
  video: HelpVideo | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState(video?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(video?.descripcion ?? '')
  const [youtubeInput, setYoutubeInput] = useState(video?.youtubeId ?? '')
  const [modulo, setModulo] = useState(video?.modulo ?? '')
  const [roles, setRoles] = useState<Role[]>(video?.roles ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const youtubeId = extractYoutubeId(youtubeInput)

  function toggleRole(role: Role) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!titulo.trim()) return setError('El título es requerido')
    if (!modulo.trim()) return setError('El módulo es requerido')
    if (!youtubeId) return setError('Ingresa un link o ID válido de YouTube')
    if (roles.length === 0) return setError('Selecciona al menos un rol')

    setLoading(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        youtubeId,
        modulo: modulo.trim(),
        roles,
      }
      if (video) {
        await api.patch(`/ayuda/videos/${video.id}`, payload)
      } else {
        await api.post('/ayuda/videos', payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCn}>
          Link o ID de YouTube <span className="text-destructive">*</span>
        </label>
        <Input
          value={youtubeInput}
          onChange={(e) => setYoutubeInput(e.target.value)}
          placeholder="https://youtu.be/xxxxxxxxxxx"
          autoFocus
        />
        {youtubeId && (
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt="Miniatura"
            className="mt-2 aspect-video w-full rounded-lg object-cover"
          />
        )}
      </div>

      <div>
        <label className={labelCn}>
          Título <span className="text-destructive">*</span>
        </label>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Cómo registrar una entrada de asistencia"
        />
      </div>

      <div>
        <label className={labelCn}>Descripción</label>
        <Textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Qué resuelve este video…"
        />
      </div>

      <div>
        <label className={labelCn}>
          Módulo <span className="text-destructive">*</span>
        </label>
        <Input
          value={modulo}
          onChange={(e) => setModulo(e.target.value)}
          placeholder="Ej. Asistencia"
          list="ayuda-modulos"
        />
        <datalist id="ayuda-modulos">
          {MODULOS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      <div>
        <label className={labelCn}>
          Roles que ven este video <span className="text-destructive">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                roles.includes(role)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-ring',
              )}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? 'Guardando...' : video ? 'Guardar cambios' : 'Subir video'}
        </Button>
      </div>
    </form>
  )
}
