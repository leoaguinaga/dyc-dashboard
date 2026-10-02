import Link from 'next/link'
import { CheckCircle2, FileText, Plus, ShieldAlert } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CotizacionesView } from './CotizacionesView'
import type { SolicitudCotizacion, User } from '@/types/api'

export async function CotizacionesTable() {
  const [result, user] = await Promise.all([
    serverFetch<SolicitudCotizacion[]>('/solicitudes-cotizacion?alcance=rol').catch(
      (e: Error) => e,
    ),
    serverFetch<User>('/users/me').catch(() => null),
  ])
  // Gerencia solo ve lo que espera su aprobación de compra.
  const soloAprobacionGerencia = user?.role === 'gerencia'

  if (result instanceof Error) {
    const is403 = result.message.includes('403')
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShieldAlert className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">
          {is403 ? 'Sin permisos' : 'Error al cargar'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {is403
            ? 'No tienes acceso a este módulo.'
            : 'No se pudieron cargar las solicitudes. Intenta de nuevo.'}
        </p>
      </div>
    )
  }

  if (result.length === 0 && soloAprobacionGerencia) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <CheckCircle2 className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">No hay compras por aprobar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando una cotización espere tu aprobación, aparecerá aquí.
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <FileText className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin solicitudes registradas</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea la primera solicitud de cotización para comenzar
        </p>
        <Link href="/cotizaciones/nueva" className={cn(buttonVariants(), 'mt-4')}>
          <Plus className="size-4" />
          Nueva solicitud
        </Link>
      </div>
    )
  }

  return <CotizacionesView solicitudes={result} soloAprobacionGerencia={soloAprobacionGerencia} />
}
