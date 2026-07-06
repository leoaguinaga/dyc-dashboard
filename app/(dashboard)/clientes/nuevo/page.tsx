import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateClienteForm } from './components/CreateClienteForm'

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a clientes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Registra una empresa cliente en el sistema.
        </p>
      </div>

      <div className="rounded-xl border border-border max-w-4xl bg-white p-6">
        <CreateClienteForm />
      </div>
    </div>
  )
}
