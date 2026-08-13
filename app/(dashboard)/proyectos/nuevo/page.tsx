import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CreateProyectoForm } from './components/CreateProyectoForm'
import type { Cliente, Proyecto, Trabajador, User } from '@/types/api'

const CON_ACCESO_CREACION = ['administrador', 'gerencia']

export default async function NuevoProyectoPage() {
  const [clientes, trabajadores, proyectos, user] = await Promise.all([
    serverFetch<Cliente[]>('/clientes').catch(() => [] as Cliente[]),
    serverFetch<Trabajador[]>('/trabajadores').catch(() => [] as Trabajador[]),
    serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[]),
    serverFetch<User>('/users/me').catch(() => null),
  ])

  if (!user || !CON_ACCESO_CREACION.includes(user.role)) redirect('/proyectos')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a proyectos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo proyecto</h1>
        <p className="text-sm text-muted-foreground">
          Completa los datos para registrar un nuevo proyecto en el sistema.
        </p>
      </div>

      <div className="rounded-xl max-w-4xl border border-border bg-white p-6">
        <CreateProyectoForm clientes={clientes} trabajadores={trabajadores} proyectos={proyectos} />
      </div>
    </div>
  )
}
