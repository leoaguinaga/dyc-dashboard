'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Pencil, Check, X } from 'lucide-react'
import type { TipoOrdenCompra } from '@/types/api'

interface Props {
  ocId: string
  numero: string
  tipo: TipoOrdenCompra
  editable?: boolean
}

export function NumeroTipoEditor({ ocId, numero, tipo, editable = true }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(numero)
  const [tipoValue, setTipoValue] = useState<TipoOrdenCompra>(tipo)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const role = session?.user?.role
  const canEdit = editable && (role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia')

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await api.patch(`/ordenes-compra/${ocId}`, { numero: value.trim(), tipo: tipoValue })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValue(numero)
    setTipoValue(tipo)
    setEditing(false)
    setErr(null)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 group">
        <h1 className="text-2xl font-semibold tracking-tight font-mono">{numero}</h1>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          >
            <Pencil className="size-3" />
            Editar
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          placeholder="Ej: OC-2026-0001"
          autoFocus
          className="w-40 rounded-md border border-border bg-white px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Select value={tipoValue} onValueChange={(v) => setTipoValue(v as TipoOrdenCompra)}>
          <SelectTrigger className="w-44 h-8">
            {tipoValue === 'servicio' ? 'Orden de Servicio' : 'Orden de Compra'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compra">Orden de Compra</SelectItem>
            <SelectItem value="servicio">Orden de Servicio</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={save} disabled={saving} className="h-7 px-2 text-xs gap-1">
          <Check className="size-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={saving} className="h-7 px-2 text-xs gap-1">
          <X className="size-3" />
        </Button>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  )
}
