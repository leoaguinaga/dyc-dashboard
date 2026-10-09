import { redirect } from 'next/navigation'
import { RegistroHeader } from '@/components/registro/RegistroHeader'
import { serverFetch } from '@/lib/api/server'
import { CreateCompraSimpleForm } from './components/CreateCompraSimpleForm'
import type { Proyecto, Proveedor, User } from '@/types/api'

// Debe coincidir con @Roles(...) en compras-simples.controller.ts
const CON_ACCESO_CREACION = [
  'supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr',
  'ing_civil', 'ing_electrico', 'jefe_sig', 'coordinador_ssoma',
  'logistica', 'gerencia', 'administrador', 'admin_ti',
]

export default async function NuevaCompraSimplePage() {
  const [proyectos, proveedores, user] = await Promise.all([
    serverFetch<Proyecto[]>('/proyectos?todos=1').catch(() => [] as Proyecto[]),
    serverFetch<Proveedor[]>('/proveedores').catch(() => [] as Proveedor[]),
    serverFetch<User>('/users/me').catch(() => null),
  ])

  if (!user || !CON_ACCESO_CREACION.includes(user.role)) redirect('/compras-simples')

  return (
    <div className="space-y-4">
      <RegistroHeader backHref="/compras-simples" backLabel="Volver a compras simples" title="Nueva compra simple" estado="Sin registrar" />
      <CreateCompraSimpleForm proyectos={proyectos} proveedores={proveedores} />
    </div>
  )
}
