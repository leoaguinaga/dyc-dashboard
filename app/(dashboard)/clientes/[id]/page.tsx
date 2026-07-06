import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClienteDetail } from './components/ClienteDetail'
import { ClienteDetailSkeleton } from './components/ClienteDetailSkeleton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-3">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Link>
      <Suspense fallback={<ClienteDetailSkeleton />}>
        <ClienteDetail id={id} />
      </Suspense>
    </div>
  )
}
