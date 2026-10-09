'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Check, X, MapPin } from 'lucide-react'
import { EditButton } from './EditButton'

interface Props {
  ocId: string
  lugarEntrega: string | null | undefined
  editable?: boolean
}

export function LugarEntregaEditor({ ocId, lugarEntrega, editable = true }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(lugarEntrega ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const role = session?.user?.role
  const canEdit = editable && (role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia')

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await api.patch(`/ordenes-compra/${ocId}`, { lugarEntrega: value.trim() || null })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValue(lugarEntrega ?? '')
    setEditing(false)
    setErr(null)
  }

  const label = (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="size-3.5" aria-hidden="true" />
      Lugar de entrega
    </span>
  )

  if (!editing) {
    if (!lugarEntrega) {
      return (
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
            {label}
            <span className="text-muted-foreground italic">· Sin definir</span>
          </span>
          {canEdit && <EditButton variant="definir" target="el lugar de entrega" onClick={() => setEditing(true)} />}
        </div>
      )
    }
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          {label}
          <p className="text-sm font-medium text-foreground">{lugarEntrega}</p>
        </div>
        {canEdit && <EditButton target="el lugar de entrega" onClick={() => setEditing(true)} />}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') cancel()
        }}
        aria-label="Lugar de entrega"
        placeholder="Ej: Av. Industrial 123, Ate, Lima"
        autoFocus
        className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-1.5">
        <Button size="sm" onClick={save} disabled={saving} className="h-7 px-3 text-xs gap-1">
          <Check className="size-3" />
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={saving} className="h-7 px-2 text-xs gap-1">
          <X className="size-3" />
          Cancelar
        </Button>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
    </div>
  )
}
