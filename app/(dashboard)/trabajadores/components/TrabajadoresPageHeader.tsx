import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { SiPuedeEditar } from '@/lib/accesos'

export function TrabajadoresPageHeader() {
  return (
    <PageHeader
      title="Trabajadores"
      description="Gestión y registro de personal de obra y administrativo."
      actions={
        <SiPuedeEditar modulo="trabajadores">
          <Link href="/trabajadores/nuevo">
            <Button>
              <UserPlus className="size-4" />
              Registrar trabajador
            </Button>
          </Link>
        </SiPuedeEditar>
      }
    />
  )
}
