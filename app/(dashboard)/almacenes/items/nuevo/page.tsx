import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateItemForm } from './components/CreateItemForm'

export default function NuevoItemPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/almacenes/items"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al catálogo
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo ítem</h1>
        <p className="text-sm text-muted-foreground">
          Registra un ítem en el catálogo de inventario.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 max-w-2xl">
        <CreateItemForm />
      </div>
    </div>
  )
}
