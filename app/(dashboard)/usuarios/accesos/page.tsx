import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { MatrizAccesosView } from './components/MatrizAccesosView'
import type { MatrizAccesos, User } from '@/types/api'

export default async function AccesosPorModuloPage() {
  const [matriz, me] = await Promise.all([
    serverFetch<MatrizAccesos>('/rbac/modulos').catch(() => null),
    serverFetch<User>('/users/me'),
  ])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a usuarios
        </Link>
        <h1 className="pt-1 text-2xl font-semibold tracking-tight">Accesos por módulo</h1>
        <p className="text-sm text-muted-foreground">
          Excepciones al acceso que trae cada rol. Para una persona puntual, configúralo en su ficha de usuario.
        </p>
      </div>

      {matriz ? (
        <MatrizAccesosView initial={matriz} editable={me.role === 'admin_ti'} />
      ) : (
        <p className="text-sm text-destructive">No tienes permiso para ver esta configuración.</p>
      )}
    </div>
  )
}
