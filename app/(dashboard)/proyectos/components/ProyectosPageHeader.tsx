"use client"

import { useSession } from '@/lib/auth/session'
import { useNivelModulo } from '@/lib/accesos'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { History, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'

const CON_ACCESO_CREACION = ['administrador', 'admin_ti', 'gerencia']

export function ProyectosPageHeader() {
  const { data: session } = useSession()
  const excepcion = useNivelModulo('proyectos')
  const puedeCrear = excepcion
    ? excepcion === 'editar'
    : !!session?.user?.role && CON_ACCESO_CREACION.includes(session.user.role)

  return (
    <PageHeader
      title="Proyectos"
      description="Información general de los proyectos que se están ejecutando."
      actions={
        <>
          <Link href="/proyectos/historial">
            <Button variant="outline">
              <History className="size-4" />
              Historial
            </Button>
          </Link>
          {puedeCrear && (
            <Link href="/proyectos/nuevo">
              <Button>
                <Plus className="size-4" />
                Registrar Proyecto
              </Button>
            </Link>
          )}
        </>
      }
    />
  )
}
