import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { Proveedor } from '@/types/api'
import { EditProveedorForm } from './components/EditProveedorForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarProveedorPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<Proveedor>(`/proveedores/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el proveedor.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/proveedores/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al proveedor
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar proveedor</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los datos de <span className="font-medium text-foreground">{result.razonSocial}</span>.
        </p>
      </div>

      <div className="rounded-xl max-w-4xl border border-border bg-white p-6">
        <EditProveedorForm proveedor={result} />
      </div>
    </div>
  )
}
