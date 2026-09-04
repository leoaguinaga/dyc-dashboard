import { Button } from '@/components/ui/button'
import { Clock, History, Plus } from 'lucide-react'
import Link from 'next/link'

export default function CotizacionesPageHeader() {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
                <p className="text-sm text-muted-foreground">
                    Gestión de solicitudes de cotización a proveedores y comparativas de ofertas por proyecto.
                </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
                <Link href="/cotizaciones/historial">
                    <Button variant="outline">
                        <History className="size-4" />
                        Historial
                    </Button>
                </Link>
                <Link href="/cotizaciones/nueva">
                    <Button>
                        <Plus className="size-4" />
                        Nueva solicitud
                    </Button>
                </Link>
            </div>
        </div>
    )
}