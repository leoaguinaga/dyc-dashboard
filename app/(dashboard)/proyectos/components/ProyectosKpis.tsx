import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { Proyecto } from '@/types/api'

export async function ProyectosKpis() {
  const result = await serverFetch<Proyecto[]>('/proyectos').catch(() => null)
  if (!result) return null

  const enEjecucion = result.filter((p) => p.estado === 'ejecucion').length
  const enPlanificacion = result.filter((p) => p.estado === 'planificacion').length
  const total = result.length
  const cerrados = result.filter((p) => p.estado === 'cierre' || p.estado === 'liquidada').length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="En ejecución"
        value={enEjecucion}
        context={total > 0 ? `de ${total} registrados` : undefined}
      />
      <KpiCard
        label="En planificación"
        value={enPlanificacion}
        delta={enPlanificacion > 0 ? { label: 'Pendientes', trend: 'neutral' } : undefined}
        context={enPlanificacion > 0 ? 'Requieren seguimiento' : 'Sin pendientes'}
      />
      <KpiCard
        label="Cerrados / Liquidados"
        value={cerrados}
        context={total > 0 ? `${Math.round((cerrados / total) * 100)}% del total` : undefined}
      />
    </div>
  )
}
