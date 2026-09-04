import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProveedoresPageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de proveedores y comparativas de ofertas por proyecto.
        </p>
      </div>
      <Link href="/proveedores/nuevo">
        <Button>
          <Plus className="size-4" />
          Nuevo proveedor
        </Button>
      </Link>
    </div>
  )
}
