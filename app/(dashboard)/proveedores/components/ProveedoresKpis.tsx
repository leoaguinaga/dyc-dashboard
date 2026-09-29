import { KpiCard } from '@/components/shared/KpiCard'
import type { Proveedor } from '@/types/api'
import { datosIncompletos, formatSoles } from './utils'

export function ProveedoresKpis({ proveedores }: { proveedores: Proveedor[] }) {
  const activos = proveedores.filter((p) => p.activo)
  const conOc90 = activos.filter((p) => (p.actividad?.monto90d ?? 0) > 0)
  const montos = conOc90.map((p) => p.actividad!.monto90d).sort((a, b) => b - a)
  const total90 = montos.reduce((s, m) => s + m, 0)
  const top3 = montos.slice(0, 3).reduce((s, m) => s + m, 0)
  const incompletos = activos.filter(datosIncompletos).length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Activos"
        value={activos.length}
        context={`de ${proveedores.length} registrados`}
      />
      <KpiCard
        label="Con OC en 90 días"
        value={conOc90.length}
        context={
          activos.length > 0
            ? `${Math.round((conOc90.length / activos.length) * 100)}% de los activos`
            : undefined
        }
      />
      <KpiCard
        label="Comprado en 90 días"
        value={formatSoles(total90)}
        context={total90 > 0 ? `Top 3 = ${Math.round((top3 / total90) * 100)}%` : 'Sin órdenes emitidas'}
      />
      <KpiCard
        label="Datos incompletos"
        value={incompletos}
        delta={incompletos > 0 ? { label: 'Completar', trend: 'down' } : undefined}
        context="Sin contacto o categoría"
      />
    </div>
  )
}
