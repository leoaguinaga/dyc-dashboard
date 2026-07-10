import { BellOff, ShieldAlert } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { NotificacionesTableClient } from './NotificacionesTableClient'
import type { Notificacion } from '@/types/api'

export async function NotificacionesTable() {
  const result = await serverFetch<Notificacion[]>('/notificaciones?limit=20').catch(
    (e: Error) => e,
  )

  if (result instanceof Error) {
    const is403 = result.message.includes('403')
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShieldAlert className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">
          {is403 ? 'Sin permisos' : 'Error al cargar'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          No se pudieron cargar las notificaciones. Intenta de nuevo.
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <BellOff className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin notificaciones</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí verás avisos de pagos, requerimientos, cotizaciones y órdenes de compra.
        </p>
      </div>
    )
  }

  return <NotificacionesTableClient initial={result} />
}
