'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Cobro } from '@/types/api'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MarcarCobradoCard({ cobro }: { cobro: Cobro }) {
  const router = useRouter()
  const [fechaCobrada, setFechaCobrada] = useState(hoyISO)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function marcarCobrado() {
    setSaving(true)
    setError(null)
    try {
      await api.post(`/cobros/${cobro.id}/marcar-cobrado`, { fechaCobrada })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al marcar como cobrado')
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Marcar como cobrado</h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de cobro</label>
        <Input type="date" value={fechaCobrada} onChange={(e) => setFechaCobrada(e.target.value)} className="h-9 text-sm max-w-xs" />
      </div>
      <Button onClick={marcarCobrado} disabled={saving}>
        <Check className="size-3.5" />
        {saving ? 'Guardando…' : 'Marcar como cobrado'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
