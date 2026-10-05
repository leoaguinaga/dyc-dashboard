'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LockIcon } from 'lucide-react'
import { useExcepcionesModulo } from '@/lib/accesos'
import { findNavItem } from './routes-config'

/**
 * Corta la página cuando una excepción deja al usuario sin acceso al módulo.
 * Sin excepción no hace nada: el menú y el backend ya filtran por rol.
 */
export function ModuloGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const excepciones = useExcepcionesModulo()
  const item = findNavItem(pathname)

  if (item?.modulo && excepciones[item.modulo] === 'ninguno') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <LockIcon className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">No tienes acceso a {item.label}</h1>
        <p className="text-sm text-muted-foreground">
          Tu acceso a este módulo fue restringido. Si lo necesitas, pídeselo al área de TI.
        </p>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return children
}
