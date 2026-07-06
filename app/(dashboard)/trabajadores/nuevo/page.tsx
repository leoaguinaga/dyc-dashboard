import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateTrabajadorForm } from './components/CreateTrabajadorForm'

export default function NuevoTrabajadorPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/trabajadores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a trabajadores
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo trabajador</h1>
        <p className="text-sm text-muted-foreground">
          Registra un trabajador y opcionalmente crea su acceso al sistema.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 max-w-4xl">
        <CreateTrabajadorForm />
      </div>
    </div>
  )
}
