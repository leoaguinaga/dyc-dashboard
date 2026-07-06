import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CreateRequerimientoForm } from './components/CreateRequerimientoForm'
import type { Proyecto } from '@/types/api'

export default async function NuevoRequerimientoPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/requerimientos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a requerimientos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo requerimiento</h1>
        <p className="text-sm text-muted-foreground">
          Describe los materiales o equipos que necesitas para el proyecto.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <CreateRequerimientoForm proyectos={proyectos} />
      </div>
    </div>
  )
}
