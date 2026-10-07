import { Button } from '@/components/ui/button'
import { History, Plus } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { SiPuedeEditar } from '@/lib/accesos'

export default function CotizacionesPageHeader() {
  return (
    <PageHeader
      title="Cotizaciones"
      description="Gestión de solicitudes de cotización a proveedores y comparativas de ofertas por proyecto."
      actions={
        <>
          <Link href="/cotizaciones/historial">
            <Button variant="outline">
              <History className="size-4" />
              Historial
            </Button>
          </Link>
          <SiPuedeEditar modulo="cotizaciones">
            <Link href="/cotizaciones/nueva">
              <Button>
                <Plus className="size-4" />
                Nueva solicitud
              </Button>
            </Link>
          </SiPuedeEditar>
        </>
      }
    />
  )
}
