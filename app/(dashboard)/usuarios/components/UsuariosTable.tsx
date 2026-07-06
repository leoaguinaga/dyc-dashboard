import { ShieldAlert, Users } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { UsuariosTableClient } from './UsuariosTableClient'
import type { User } from '@/types/api'

export async function UsuariosTable() {
  const result = await serverFetch<User[]>('/users').catch((e: Error) => e)

  if (result instanceof Error) {
    const is403 = result.message.includes('403')
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShieldAlert className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">
          {is403 ? 'Sin permisos' : 'Error al cargar'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {is403
            ? 'No tienes acceso a este módulo. Contacta al administrador.'
            : 'No se pudieron cargar los usuarios. Intenta de nuevo.'}
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Users className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin usuarios registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Los usuarios se crean al vincular trabajadores al sistema.
        </p>
      </div>
    )
  }

  return <UsuariosTableClient usuarios={result} />
}
