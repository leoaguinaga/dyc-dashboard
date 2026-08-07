import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CreateCompraSimpleForm } from './components/CreateCompraSimpleForm'
import type { Proyecto, Proveedor } from '@/types/api'

export default async function NuevaCompraSimplePage() {
  const [proyectos, proveedores] = await Promise.all([
    serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[]),
    serverFetch<Proveedor[]>('/proveedores').catch(() => [] as Proveedor[]),
  ])

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
