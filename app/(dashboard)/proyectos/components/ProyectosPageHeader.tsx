"use client"

import { useSession } from '@/lib/auth/session'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { History, Plus } from 'lucide-react'

const CON_ACCESO_CREACION = ['administrador', 'admin_ti', 'gerencia']

export function ProyectosPageHeader() {
  const { data: session } = useSession()
  const puedeCrear = !!session?.user?.role && CON_ACCESO_CREACION.includes(session.user.role)

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <p className="text-sm text-muted-foreground">
          Información general de los proyectos que se están ejecutando.
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <Link href="/proyectos/historial">
          <Button variant="outline">
            <History className='size-4' />
            Historial
          </Button>
        </Link>
        {puedeCrear && (
          <Link href="/proyectos/nuevo">
            <Button>
              <Plus className='size-4' />
              Registrar Proyecto
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
