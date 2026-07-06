import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { Requerimiento } from '@/types/api'

export async function RequerimientosKpis() {
  const result = await serverFetch<Requerimiento[]>('/requerimientos').catch(() => null)
  if (!result) return null

  const total = result.length
  const urgentes = result.filter((r) => r.urgente).length
  const enviados = result.filter((r) => r.estado === 'enviado').length
  const aprobados = result.filter((r) => r.estado === 'aprobado').length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard label="Total" value={total} context="Requerimientos registrados" />
      <KpiCard
        label="Pendientes"
        value={enviados}
        context={enviados > 0 ? 'Esperando revisión de logística' : 'Sin pendientes'}
        delta={enviados > 0 ? { label: String(enviados), trend: 'neutral' } : undefined}
      />
      <KpiCard
        label="Aprobados"
        value={aprobados}
        context={aprobados > 0 ? 'Listos para cotizar' : 'Ninguno aprobado aún'}
        delta={aprobados > 0 ? { label: String(aprobados), trend: 'up' } : undefined}
      />
      <KpiCard
        label="Urgentes"
        value={urgentes}
        context={urgentes > 0 ? 'Requieren atención prioritaria' : 'Sin urgencias'}
        delta={urgentes > 0 ? { label: String(urgentes), trend: 'down' } : undefined}
      />
    </div>
  )
}
