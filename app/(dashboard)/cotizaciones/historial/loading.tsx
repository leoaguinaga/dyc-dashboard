import { CotizacionesTableSkeleton } from '../components/CotizacionesTableSkeleton'

export default function CotizacionesHistorialLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-6 w-64 animate-pulse rounded bg-muted" />
      </div>
      <CotizacionesTableSkeleton />
    </div>
  )
}
