import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateProveedorForm } from './components/CreateProveedorForm'

export default function NuevoProveedorPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a proveedores
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo proveedor</h1>
        <p className="text-sm text-muted-foreground">
          Completa los datos para registrar un nuevo proveedor en el sistema.
        </p>
      </div>

      <div className="rounded-xl max-w-4xl border border-border bg-white p-6">
        <CreateProveedorForm />
      </div>
    </div>
  )
}
