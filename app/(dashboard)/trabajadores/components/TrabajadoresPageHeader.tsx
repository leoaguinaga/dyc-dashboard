import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TrabajadoresPageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Trabajadores</h1>
        <p className="text-sm text-muted-foreground">
          Gestión y registro de personal de obra y administrativo.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <Link href="/trabajadores/nuevo">
          <Button>
            <UserPlus className="size-4" />
            Registrar trabajador
          </Button>
        </Link>
      </div>
    </div>
  )
}

