'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Proveedor } from '@/types/api'

interface Props {
  solicitudId: string
  proveedores: Proveedor[]
  proveedoresYaInvitados: string[]
}

export function InviteProveedorForm({ solicitudId, proveedores, proveedoresYaInvitados }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [proveedorId, setProveedorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disponibles = proveedores.filter((p) => p.activo && !proveedoresYaInvitados.includes(p.id))

  async function handleInvite() {
    if (!proveedorId) return
    setLoading(true)
    setError(null)
    try {
      await api.post(`/solicitudes-cotizacion/${solicitudId}/cotizaciones`, { proveedorId })
      setOpen(false)
      setProveedorId('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar al proveedor')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
      >
        <Plus className="size-3.5" />
        Invitar proveedor
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Select value={proveedorId} onValueChange={(v) => setProveedorId(v ?? '')}>
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="Seleccionar proveedor…">
              {(value: string | null) =>
                proveedores.find((p) => p.id === value)?.razonSocial ?? 'Seleccionar proveedor…'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-full min-w-64" align='end'>
            {disponibles.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Todos los proveedores activos ya fueron invitados</p>
            ) : (
              disponibles.map((p) => {
                const ubicacion = [p.departamento, p.distrito].filter(Boolean).join(', ')
                return (
                  <SelectItem key={p.id} value={p.id} className="py-1.5">
                    <div className="flex flex-col items-start text-left leading-tight">
                      <span className="font-medium text-foreground">{p.razonSocial}</span>
                      {ubicacion && (
                        <span className="text-xs text-muted-foreground font-normal mt-0.5">
                          {ubicacion}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )
              })
            )}
          </SelectContent>
        </Select>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <Button size="sm" onClick={handleInvite} disabled={!proveedorId || loading}>
        {loading ? 'Invitando…' : 'Invitar'}
      </Button>
      <button
        onClick={() => { setOpen(false); setProveedorId(''); setError(null) }}
        className="text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
