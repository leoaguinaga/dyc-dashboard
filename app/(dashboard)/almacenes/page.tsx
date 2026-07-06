import { Suspense } from 'react'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlmacenesKpis } from './components/AlmacenesKpis'
import { AlmacenesKpisSkeleton } from './components/AlmacenesKpisSkeleton'
import { AlmacenesTable } from './components/AlmacenesTable'
import { AlmacenesTableSkeleton } from './components/AlmacenesTableSkeleton'

export default function AlmacenesPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<AlmacenesKpisSkeleton />}>
        <AlmacenesKpis />
      </Suspense>
      <Suspense fallback={<AlmacenesTableSkeleton />}>
        <AlmacenesTable />
      </Suspense>
    </div>
  )
}
