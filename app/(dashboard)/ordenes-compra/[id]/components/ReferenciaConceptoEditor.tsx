'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X } from 'lucide-react'
import { EditButton } from './EditButton'
import type { OrdenCompra } from '@/types/api'

interface Props {
  ocId: string
  oc: Pick<OrdenCompra, 'referencia' | 'concepto'>
  editable?: boolean
}

export function ReferenciaConceptoEditor({ ocId, oc, editable = true }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [referencia, setReferencia] = useState(oc.referencia ?? '')
  const [concepto, setConcepto] = useState(oc.concepto ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const role = session?.user?.role
  const canEdit = editable && (role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia')

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

  const label = <span className="text-xs text-muted-foreground">Concepto y referencia</span>

  if (!editing) {
    const hasData = oc.referencia || oc.concepto
    if (!hasData) {
      return (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex flex-wrap items-center gap-x-1.5">
            {label}
            <span className="text-muted-foreground italic">· Sin definir</span>
          </span>
          {canEdit && <EditButton variant="definir" target="el concepto y la referencia" onClick={() => setEditing(true)} />}
        </div>
      )
    }
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1.5">
          {label}
          <dl className="grid gap-2 text-sm">
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
        </div>
        {canEdit && <EditButton target="el concepto y la referencia" onClick={() => setEditing(true)} />}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label}
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
