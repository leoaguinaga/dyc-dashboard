import type { ButtonHTMLAttributes } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Qué se edita; completa el nombre accesible ("Editar lugar de entrega"). */
  target: string
  /** "Editar" por defecto; "Definir" cuando el campo aún no tiene valor. */
  variant?: 'editar' | 'definir'
}

/**
 * Botón azul de edición/definición de la ficha de la OC. Un solo estilo para los
 * seis puntos de edición de la página, con nombre accesible propio en cada uno.
 */
export function EditButton({ target, variant = 'editar', className, ...props }: Props) {
  const Icon = variant === 'definir' ? Plus : Pencil
  const label = variant === 'definir' ? 'Definir' : 'Editar'
  return (
    <button
      type="button"
      aria-label={`${label} ${target}`}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition-colors duration-[120ms] hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </button>
  )
}
