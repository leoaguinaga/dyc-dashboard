import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CreateRequerimientoForm } from './components/CreateRequerimientoForm'
import type { Proyecto } from '@/types/api'

export default async function NuevoRequerimientoPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos?todos=1').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/solicitudes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a solicitudes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo requerimiento</h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Borrador</span>
        </div>
      </div>

      <CreateRequerimientoForm proyectos={proyectos} />
    </div>
  )
}
