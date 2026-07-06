'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  ocId: string
  nombre: string | null | undefined
}

export function NombreOcEditor({ ocId, nombre }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nombre ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const role = session?.user?.role
  const canEdit = role === 'administrador' || role === 'logistica'

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await api.patch(`/ordenes-compra/${ocId}`, { nombre: value.trim() || null })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValue(nombre ?? '')
    setEditing(false)
    setErr(null)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 group">
        <span className={nombre ? 'text-sm text-muted-foreground' : 'text-sm text-muted-foreground italic'}>
          {nombre ?? 'Sin nombre'}
        </span>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') cancel()
        }}
        placeholder="Ej: Pintura para fachada principal"
        autoFocus
        className="w-64 rounded-md border border-border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button size="sm" onClick={save} disabled={saving} className="h-7 px-2 text-xs gap-1">
        <Check className="size-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={cancel} disabled={saving} className="h-7 px-2 text-xs gap-1">
        <X className="size-3" />
      </Button>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  )
}
