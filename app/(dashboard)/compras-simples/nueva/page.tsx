import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CreateCompraSimpleForm } from './components/CreateCompraSimpleForm'
import type { Proyecto, Proveedor, User } from '@/types/api'

// Debe coincidir con ROLES_CREACION en compras-simples.service.ts
const CON_ACCESO_CREACION = ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr', 'administrador']

export default async function NuevaCompraSimplePage() {
  const [proyectos, proveedores, user] = await Promise.all([
    serverFetch<Proyecto[]>('/proyectos?todos=1').catch(() => [] as Proyecto[]),
    serverFetch<Proveedor[]>('/proveedores').catch(() => [] as Proveedor[]),
    serverFetch<User>('/users/me').catch(() => null),
  ])

  if (!user || !CON_ACCESO_CREACION.includes(user.role)) redirect('/compras-simples')

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/compras-simples"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a compras simples
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva compra simple</h1>
        <p className="text-sm text-muted-foreground">
          Registra una compra ya cotizada o realizada en campo, agrupada por empresa.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <CreateCompraSimpleForm proyectos={proyectos} proveedores={proveedores} />
      </div>
    </div>
  )
}
