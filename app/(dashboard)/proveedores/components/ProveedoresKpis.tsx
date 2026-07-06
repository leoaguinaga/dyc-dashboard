import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { Proveedor } from '@/types/api'

export async function ProveedoresKpis() {
  const result = await serverFetch<Proveedor[]>('/proveedores').catch(() => null)
  if (!result) return null

  const activos = result.filter((p) => p.activo).length
  const inactivos = result.filter((p) => !p.activo).length
  const sinContactos = result.filter((p) => p.activo && (!p.contactos || p.contactos.length === 0)).length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="Activos"
        value={activos}
        context={result.length > 0 ? `de ${result.length} registrados` : undefined}
      />
      <KpiCard
        label="Inactivos"
        value={inactivos}
        delta={inactivos > 0 ? { label: String(inactivos), trend: 'neutral' } : undefined}
        context={inactivos > 0 ? 'Fuera de operación' : 'Todos operativos'}
      />
      <KpiCard
        label="Sin contactos"
        value={sinContactos}
        delta={sinContactos > 0 ? { label: 'Completar', trend: 'down' } : undefined}
        context={sinContactos > 0 ? 'Requieren actualización' : 'Datos completos'}
      />
    </div>
  )
}
