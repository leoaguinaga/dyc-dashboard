'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Check, X } from 'lucide-react'
import type { OrdenCompra } from '@/types/api'

interface Props {
  ocId: string
  oc: Pick<OrdenCompra, 'referencia' | 'concepto'>
}

export function ReferenciaConceptoEditor({ ocId, oc }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [referencia, setReferencia] = useState(oc.referencia ?? '')
  const [concepto, setConcepto] = useState(oc.concepto ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const role = session?.user?.role
  const canEdit = role === 'administrador' || role === 'logistica'

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await api.patch(`/ordenes-compra/${ocId}`, {
        referencia: referencia.trim() || null,
        concepto: concepto.trim() || null,
      })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setReferencia(oc.referencia ?? '')
    setConcepto(oc.concepto ?? '')
    setEditing(false)
    setErr(null)
  }

  if (!editing) {
    const hasData = oc.referencia || oc.concepto
    return (
      <div className="flex items-start justify-between gap-2 group">
        {hasData ? (
          <dl className="grid gap-2 text-sm flex-1">
            {oc.concepto && (
              <div>
                <dt className="text-xs text-muted-foreground">Lo siguiente (concepto)</dt>
                <dd className="font-medium">{oc.concepto}</dd>
              </div>
            )}
            {oc.referencia && (
              <div>
                <dt className="text-xs text-muted-foreground">Referencia</dt>
                <dd className="font-medium">{oc.referencia}</dd>
              </div>
            )}
          </dl>
        ) : (
          <span className="text-sm text-muted-foreground italic">Sin definir</span>
        )}
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
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Lo siguiente (concepto)</label>
        <Input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej: Fabricación de puerta Full Vision"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Referencia</label>
        <Input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="Ej: Cotización N°132-05/26"
        />
      </div>
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
