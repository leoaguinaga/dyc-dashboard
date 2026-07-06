import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { EditClienteForm } from './components/EditClienteForm'
import type { Cliente } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<Cliente>(`/clientes/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el cliente.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/clientes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al cliente
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los datos de <span className="font-medium text-foreground">{result.razonSocial}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-border max-w-4xl bg-white p-6">
        <EditClienteForm cliente={result} />
      </div>
    </div>
  )
}
