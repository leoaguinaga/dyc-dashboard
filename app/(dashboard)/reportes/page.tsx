import { Suspense } from 'react'
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from '@/components/ui/tabs'
import { GastoPorProyectoSection } from './components/GastoPorProyectoSection'
import { OcsPorProveedorSection } from './components/OcsPorProveedorSection'
import { PagosPorPeriodoSection } from './components/PagosPorPeriodoSection'
import { ConstructorReportes } from './constructor/ConstructorReportes'

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
    <>
      {/* <Tabs defaultValue="predefinidos">
        <TabsList>
          <TabsIndicator />
          <TabsTab value="predefinidos">Predefinidos</TabsTab>
          <TabsTab value="constructor">Constructor</TabsTab>
        </TabsList>

        <TabsPanel value="predefinidos" className="space-y-3">
          <Suspense fallback={<SectionSkeleton />}>
            <GastoPorProyectoSection />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <OcsPorProveedorSection />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <PagosPorPeriodoSection />
          </Suspense>
        </TabsPanel>

        <TabsPanel value="constructor">
          <ConstructorReportes />
        </TabsPanel>
      </Tabs> */}
      <ConstructorReportes />
    </>
  )
}
