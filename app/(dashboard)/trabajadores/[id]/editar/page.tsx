import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { EditTrabajadorForm } from './components/EditTrabajadorForm'
import type { Trabajador } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarTrabajadorPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<Trabajador>(`/trabajadores/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el trabajador.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/trabajadores/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al trabajador
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar trabajador</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los datos de <span className="font-medium text-foreground">{result.nombre}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-border max-w-4xl bg-white p-6">
        <EditTrabajadorForm trabajador={result} />
      </div>
    </div>
  )
}
