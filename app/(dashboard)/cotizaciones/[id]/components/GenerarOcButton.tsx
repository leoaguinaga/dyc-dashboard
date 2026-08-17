'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ShoppingCart } from 'lucide-react'
import { ordenBasePath } from '@/lib/ordenes'
import type { Role, TipoOrdenCompra } from '@/types/api'

interface Props {
  solicitudId: string
}

export function GenerarOcButton({ solicitudId }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoOrdenCompra>('compra')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = session?.user?.role
  if (role !== 'administrador' && role !== 'admin_ti' && role !== 'logistica' && role !== 'gerencia') return null

  async function generar() {
    setLoading(true)
    setError(null)
    try {
      const oc = await api.post<{ id: string }>('/ordenes-compra', { solicitudId, tipo })
      router.push(`${ordenBasePath(tipo)}/${oc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la orden')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoOrdenCompra)}>
          <SelectTrigger className="w-44">
            {tipo === 'servicio' ? 'Orden de Servicio' : 'Orden de Compra'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compra">Orden de Compra</SelectItem>
            <SelectItem value="servicio">Orden de Servicio</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={generar} disabled={loading} className="gap-2">
          <ShoppingCart className="size-4" />
          {loading ? 'Generando…' : 'Generar orden'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
