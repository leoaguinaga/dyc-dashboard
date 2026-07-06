import { KpiCardSkeleton } from '@/components/shared/KpiCard'

export function ItemsKpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  )
}
