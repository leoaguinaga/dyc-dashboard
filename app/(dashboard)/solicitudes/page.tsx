import { Suspense } from 'react'
import { SolicitudesTable } from './components/SolicitudesTable'
import { SolicitudesTableSkeleton } from './components/SolicitudesTableSkeleton'

interface Props {
  searchParams: Promise<{ crear?: string }>;
}

export default async function SolicitudesPage({ searchParams }: Props) {
  const { crear } = await searchParams;

  return (
    <Suspense fallback={<SolicitudesTableSkeleton />}>
      <SolicitudesTable abrirNuevaSolicitud={crear === "1"} />
    </Suspense>
  )
}
