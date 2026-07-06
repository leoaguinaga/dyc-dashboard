import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { EditProyectoForm } from './components/EditProyectoForm'
import type { Cliente, Proyecto, Trabajador } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarProyectoPage({ params }: Props) {
  const { id } = await params

  const [result, clientes, trabajadores, proyectos] = await Promise.all([
    serverFetch<Proyecto>(`/proyectos/${id}`).catch((e: Error) => e),
    serverFetch<Cliente[]>('/clientes').catch(() => [] as Cliente[]),
    serverFetch<Trabajador[]>('/trabajadores').catch(() => [] as Trabajador[]),
    serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[]),
  ])

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el proyecto.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/proyectos/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al proyecto
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar proyecto</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los datos de{' '}
          <span className="font-medium text-foreground">{result.nombre}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-border max-w-4xl bg-white p-6">
        <EditProyectoForm proyecto={result} clientes={clientes} trabajadores={trabajadores} proyectos={proyectos} />
      </div>
    </div>
  )
}
