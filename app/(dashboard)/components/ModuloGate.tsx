'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LockIcon } from 'lucide-react'
import { useExcepcionesModulo } from '@/lib/accesos'
import type { Role } from '@/types/api'
import { findNavItem, itemVisible } from './routes-config'

// Roles cuyo menú es estricto: si un módulo no aparece en su menú, tampoco se
// abre escribiendo la URL (el backend ya responde 403, esto evita ver la
// pantalla vacía). El resto de los roles solo se corta por excepción.
const ROLES_CON_MENU_ESTRICTO: Role[] = ['coordinador_ssoma', 'tesoreria']

// Rutas fuera de su menú a las que el rol llega desde sus propias pantallas
// (p. ej. el enlace a la obra desde un pago).
const RUTAS_EXTRA_POR_ROL: Partial<Record<Role, string[]>> = {
  tesoreria: ['/proyectos'],
}

/**
 * Corta la página cuando una excepción deja al usuario sin acceso al módulo, o
 * cuando el rol tiene menú estricto y el módulo no es parte de él. Para los
 * demás roles no hace nada: el menú y el backend ya filtran por rol.
 */
export function ModuloGate({ children, role }: { children: React.ReactNode; role?: Role }) {
  const pathname = usePathname()
  const excepciones = useExcepcionesModulo()
  const item = findNavItem(pathname)

  const bloqueadoPorExcepcion = !!item?.modulo && excepciones[item.modulo] === 'ninguno'
  const bloqueadoPorMenu =
    !!item &&
    !!role &&
    ROLES_CON_MENU_ESTRICTO.includes(role) &&
    !itemVisible(item, role, excepciones) &&
    !(RUTAS_EXTRA_POR_ROL[role] ?? []).some((ruta) => pathname.startsWith(ruta))

  if (item && (bloqueadoPorExcepcion || bloqueadoPorMenu)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <LockIcon className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">No tienes acceso a {item.label}</h1>
        <p className="text-sm text-muted-foreground">
          {bloqueadoPorExcepcion
            ? 'Tu acceso a este módulo fue restringido. Si lo necesitas, pídeselo al área de TI.'
            : 'Tu rol no incluye este módulo. Si lo necesitas, pídeselo al área de TI.'}
        </p>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return children
}
