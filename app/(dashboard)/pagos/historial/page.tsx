import Link from 'next/link'
import { ArrowLeft, History } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { Pago, Proyecto } from '@/types/api'
import { PagosHistorialClient } from './components/PagosHistorialClient'

export default async function PagosHistorialPage() {
  const [pagosResult, proyectosResult] = await Promise.all([
    serverFetch<Pago[]>('/pagos').catch((e: Error) => e),
    serverFetch<Proyecto[]>('/proyectos').catch((e: Error) => e),
  ])

  if (pagosResult instanceof Error) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Link
            href="/pagos"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver a pagos pendientes
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Historial de pagos
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 text-center">
          <History className="size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No se pudo cargar el historial de pagos
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Ocurrió un error al consultar el servicio de pagos. Por favor, recarga la página o inténtalo nuevamente en unos minutos.
          </p>
        </div>
      </div>
    )
  }

  const pagos = pagosResult
  const proyectos = proyectosResult instanceof Error ? [] : proyectosResult

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[200ms] ease-out">
      <PagosHistorialClient pagos={pagos} proyectos={proyectos} />
    </div>
  )
}
