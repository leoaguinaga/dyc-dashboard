import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { Cliente } from '@/types/api'

export async function ClientesKpis() {
  const result = await serverFetch<Cliente[]>('/clientes').catch(() => null)
  if (!result) return null

  const activos = result.filter((c) => c.activo).length
  const inactivos = result.filter((c) => !c.activo).length
  const conProyectos = result.filter((c) => (c._count?.proyectos ?? 0) > 0).length
  const totalProyectos = result.reduce((sum, c) => sum + (c._count?.proyectos ?? 0), 0)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="Total clientes"
        value={result.length}
        context={activos > 0 ? `${activos} activos` : 'Sin clientes activos'}
      />
      <KpiCard
        label="Activos"
        value={activos}
        context={result.length > 0 ? `${Math.round((activos / result.length) * 100)}% del total` : undefined}
      />
      <KpiCard
        label="Inactivos"
        value={inactivos}
        delta={inactivos > 0 ? { label: String(inactivos), trend: 'neutral' } : undefined}
        context={inactivos === 0 ? 'Todos activos' : 'Fuera de operación'}
      />
      <KpiCard
        label="Proyectos asociados"
        value={totalProyectos}
        context={conProyectos > 0 ? `en ${conProyectos} cliente${conProyectos !== 1 ? 's' : ''}` : 'Sin proyectos registrados'}
      />
    </div>
  )
}
