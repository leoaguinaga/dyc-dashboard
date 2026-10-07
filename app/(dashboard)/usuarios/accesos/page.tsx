import { PageHeader } from '@/components/shared/PageHeader'
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
      <PageHeader
        title="Accesos por módulo"
        description="Excepciones al acceso que trae cada rol. Para una persona puntual, configúralo en su ficha de usuario."
        back={{ href: '/usuarios', label: 'Volver a usuarios' }}
      />

      {matriz ? (
        <MatrizAccesosView initial={matriz} editable={me.role === 'admin_ti'} />
      ) : (
        <p className="text-sm text-destructive">No tienes permiso para ver esta configuración.</p>
      )}
    </div>
  )
}
