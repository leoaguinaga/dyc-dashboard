import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { EditUsuarioForm } from './components/EditUsuarioForm'
import { ImpersonateButtonHeader } from './components/ImpersonateButtonHeader'
import type { User } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarUsuarioPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<User>(`/users/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el usuario.</p>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a usuarios
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editar usuario</h1>
            <p className="text-sm text-muted-foreground">
              Modifica el nombre o rol de <span className="font-medium text-foreground">{result.name}</span>.
            </p>
          </div>
          <ImpersonateButtonHeader targetUser={result} />
        </div>
      </div>

      <div className="rounded-xl border border-border max-w-lg bg-white p-6">
        <EditUsuarioForm usuario={result} />
      </div>
    </div>
  )
}
