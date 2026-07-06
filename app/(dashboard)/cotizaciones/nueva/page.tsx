import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { CreateSolicitudForm } from './components/CreateSolicitudForm'
import type { Proveedor, Requerimiento } from '@/types/api'

interface Props {
  searchParams: Promise<{ requerimientoId?: string }>
}

export default async function NuevaSolicitudPage({ searchParams }: Props) {
  const { requerimientoId } = await searchParams

  const [requerimientos, proveedores, requerimientoActual] = await Promise.all([
    serverFetch<Requerimiento[]>('/requerimientos?estado=aprobado').catch(() => [] as Requerimiento[]),
    serverFetch<Proveedor[]>('/proveedores').catch(() => [] as Proveedor[]),
    requerimientoId
      ? serverFetch<Requerimiento>(`/requerimientos/${requerimientoId}`).catch(() => null)
      : Promise.resolve(null),
  ])

  const proveedoresActivos = proveedores.filter((p) => p.activo)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1">
        <Link
          href={requerimientoActual ? `/requerimientos/${requerimientoActual.id}` : '/cotizaciones'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {requerimientoActual ? `Volver a ${requerimientoActual.codigo}` : 'Volver a cotizaciones'}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva solicitud de cotización</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona el requerimiento aprobado y elige los proveedores a cotizar.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <CreateSolicitudForm
          requerimientos={requerimientos}
          proveedores={proveedoresActivos}
          requerimientoInicial={requerimientoActual}
        />
      </div>
    </div>
  )
}
