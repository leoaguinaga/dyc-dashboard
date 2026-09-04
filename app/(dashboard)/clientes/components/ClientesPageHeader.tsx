import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ClientesPageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de clientes y empresas asociadas a los proyectos.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <Link href="/clientes/nuevo">
          <Button>
            <Plus className="size-4" />
            Registrar cliente
          </Button>
        </Link>
      </div>
    </div>
  )
}

