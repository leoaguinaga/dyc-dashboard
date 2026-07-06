'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import type { Role } from '@/types/api'

interface Props {
  solicitudId: string
}

export function GenerarOcButton({ solicitudId }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = session?.user?.role
  if (role !== 'administrador' && role !== 'logistica') return null

  async function generar() {
    setLoading(true)
    setError(null)
    try {
      const oc = await api.post<{ id: string }>('/ordenes-compra', { solicitudId })
      router.push(`/ordenes-compra/${oc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la orden')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={generar} disabled={loading} className="gap-2">
        <ShoppingCart className="size-4" />
        {loading ? 'Generando…' : 'Generar orden de compra'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
