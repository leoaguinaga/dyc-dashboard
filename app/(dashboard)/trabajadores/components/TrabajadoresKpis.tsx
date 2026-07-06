import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { Trabajador } from '@/types/api'

export async function TrabajadoresKpis() {
  const result = await serverFetch<Trabajador[]>('/trabajadores').catch(() => null)
  if (!result) return null

  const activos = result.filter((t) => t.activo).length
  const inactivos = result.filter((t) => !t.activo).length
  const sinCargo = result.filter((t) => t.activo && !t.cargo).length
  const conAcceso = result.filter((t) => t.userId).length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="Activos"
        value={activos}
        context={result.length > 0 ? `de ${result.length} registrados` : undefined}
      />
      <KpiCard
        label="Inactivos"
        value={inactivos}
        delta={inactivos > 0 ? { label: String(inactivos), trend: 'neutral' } : undefined}
        context={inactivos > 0 ? 'Fuera de nómina' : 'Todos en nómina'}
      />
      <KpiCard
        label="Sin cargo asignado"
        value={sinCargo}
        delta={sinCargo > 0 ? { label: 'Completar', trend: 'down' } : undefined}
        context={sinCargo > 0 ? 'Requieren actualización' : 'Datos completos'}
      />
      <KpiCard
        label="Con acceso al sistema"
        value={conAcceso}
        context={result.length > 0 ? `${Math.round((conAcceso / result.length) * 100)}% del total` : undefined}
      />
    </div>
  )
}
