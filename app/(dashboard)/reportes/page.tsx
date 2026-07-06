import { Suspense } from 'react'
import { GastoPorProyectoSection } from './components/GastoPorProyectoSection'
import { OcsPorProveedorSection } from './components/OcsPorProveedorSection'
import { PagosPorPeriodoSection } from './components/PagosPorPeriodoSection'

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="h-[320px] rounded-xl border border-border bg-muted/40 animate-pulse lg:col-span-2" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <div className="h-24 rounded-lg border border-border bg-muted/40 animate-pulse" />
        <div className="h-24 rounded-lg border border-border bg-muted/40 animate-pulse" />
      </div>
    </div>
  )
}

export default function ReportesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Reportes predefinidos de gasto, proveedores y pagos.
        </p>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <GastoPorProyectoSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <OcsPorProveedorSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <PagosPorPeriodoSection />
      </Suspense>
    </div>
  )
}
