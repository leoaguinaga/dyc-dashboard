import Link from 'next/link'
import { ShieldCheckIcon } from 'lucide-react'

export function UsuariosPageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de accesos, roles y usuarios del sistema.
        </p>
      </div>
      <Link
        href="/usuarios/accesos"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium transition-colors duration-[120ms] hover:bg-muted"
      >
        <ShieldCheckIcon className="size-4" />
        Accesos por módulo
      </Link>
    </div>
  )
}
