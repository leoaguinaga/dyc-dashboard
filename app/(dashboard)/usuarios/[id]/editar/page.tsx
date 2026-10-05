import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { EditUsuarioForm } from './components/EditUsuarioForm'
import { ImpersonateButtonHeader } from './components/ImpersonateButtonHeader'
import { AccesosUsuarioSection } from './components/AccesosUsuarioSection'
import type { AccesosUsuario, User } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarUsuarioPage({ params }: Props) {
  const { id } = await params
  const [result, accesos, me] = await Promise.all([
    serverFetch<User>(`/users/${id}`).catch((e: Error) => e),
    serverFetch<AccesosUsuario>(`/rbac/modulos/usuarios/${id}`).catch(() => null),
    serverFetch<User>('/users/me').catch(() => null),
  ])

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

      <div className="max-w-lg rounded-xl border border-border bg-white p-4 sm:p-6">
        <EditUsuarioForm usuario={result} />
      </div>

      {accesos && (
        <section className="max-w-lg space-y-3 rounded-xl border border-border bg-white p-4 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Acceso por módulo</h2>
            <p className="text-sm text-muted-foreground">
              Excepciones solo para esta persona. Ganan sobre lo que tenga su rol.
            </p>
          </div>
          <AccesosUsuarioSection initial={accesos} editable={me?.role === 'admin_ti'} />
        </section>
      )}
    </div>
  )
}
