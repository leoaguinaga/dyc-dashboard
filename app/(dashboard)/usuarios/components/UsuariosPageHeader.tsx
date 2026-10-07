import Link from 'next/link'
import { ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'

export function UsuariosPageHeader() {
  return (
    <PageHeader
      title="Usuarios"
      description="Gestión de accesos, roles y usuarios del sistema."
      actions={
        <Link href="/usuarios/accesos">
          <Button variant="outline">
            <ShieldCheckIcon className="size-4" />
            Accesos por módulo
          </Button>
        </Link>
      }
    />
  )
}
