import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { ItemInventario } from '@/types/api'

export async function ItemsKpis() {
  const result = await serverFetch<ItemInventario[]>('/inventario').catch(() => null)
  if (!result) return null

  const activos = result.filter((i) => i.activo)
  const consumibles = activos.filter((i) => i.tipo === 'consumible').length
  const equipos = activos.filter((i) => i.tipo === 'activo').length
  const categorias = new Set(activos.map((i) => i.categoria).filter(Boolean)).size

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="Ítems activos"
        value={activos.length}
        context={result.length !== activos.length ? `de ${result.length} totales` : 'Catálogo completo'}
      />
      <KpiCard label="Consumibles" value={consumibles} context="Materiales de obra" />
      <KpiCard label="Equipos / Activos" value={equipos} context="Con trazabilidad" />
      <KpiCard
        label="Categorías"
        value={categorias}
        context={categorias > 0 ? 'en uso' : 'Sin clasificar'}
      />
    </div>
  )
}
