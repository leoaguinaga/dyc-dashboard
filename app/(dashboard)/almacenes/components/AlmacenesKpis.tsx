import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { Almacen } from '@/types/api'

export async function AlmacenesKpis() {
  const result = await serverFetch<Almacen[]>('/almacenes').catch(() => null)
  if (!result) return null

  const fijos = result.filter((a) => a.tipo === 'fijo').length
  const temporales = result.filter((a) => a.tipo === 'temporal' && a.activo).length
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="Total almacenes"
        value={result.length}
        context="Fijos y temporales"
      />
      <KpiCard
        label="Fijos"
        value={fijos}
        context="Chiclayo, Lima y otros"
      />
      <KpiCard
        label="Temporales activos"
        value={temporales}
        context="Vinculados a proyectos activos"
      />
    </div>
  )
}
