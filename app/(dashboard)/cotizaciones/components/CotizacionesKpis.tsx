import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { SolicitudCotizacion } from '@/types/api'

export async function CotizacionesKpis() {
  const result = await serverFetch<SolicitudCotizacion[]>('/solicitudes-cotizacion').catch(() => null)
  if (!result) return null

  const total = result.length
  const borradores = result.filter((s) => s.estado === 'borrador').length
  const enProceso = result.filter((s) => s.estado === 'enviada' || s.estado === 'cotizada').length
  const aprobadas = result.filter((s) => s.estado === 'aprobada_gerencia' || s.estado === 'seleccionada').length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard label="Total" value={total} context="Solicitudes registradas" />
      <KpiCard
        label="En proceso"
        value={enProceso}
        context={enProceso > 0 ? 'Enviadas o con respuestas' : 'Sin solicitudes activas'}
        delta={enProceso > 0 ? { label: String(enProceso), trend: 'neutral' } : undefined}
      />
      <KpiCard
        label="Aprobadas"
        value={aprobadas}
        context={aprobadas > 0 ? 'Proveedor seleccionado' : 'Ninguna aprobada aún'}
        delta={aprobadas > 0 ? { label: String(aprobadas), trend: 'up' } : undefined}
      />
      <KpiCard
        label="Borradores"
        value={borradores}
        context={borradores > 0 ? 'Sin enviar a proveedores' : 'Sin borradores pendientes'}
      />
    </div>
  )
}
