import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CotizacionesHistorialTable } from './components/CotizacionesHistorialTable'
import type { SolicitudCotizacion } from '@/types/api'

export default async function CotizacionesHistorialPage() {
  const result = await serverFetch<SolicitudCotizacion[]>(
    '/solicitudes-cotizacion/historial?limit=30',
  ).catch((e: Error) => e)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/cotizaciones"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a cotizaciones
        </Link>
        <h1 className="text-lg font-semibold">Historial de cotizaciones</h1>
        <p className="text-sm text-muted-foreground">
          Solicitudes aprobadas o canceladas en días anteriores.
        </p>
      </div>

      {result instanceof Error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">Error al cargar</p>
          <p className="mt-1 text-sm text-muted-foreground">No se pudo cargar el historial.</p>
        </div>
      ) : (
        <CotizacionesHistorialTable initial={result} />
      )}
    </div>
  )
}
