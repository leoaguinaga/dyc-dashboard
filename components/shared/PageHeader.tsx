import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  /** Enlace de retorno para pantallas de segundo nivel. */
  back?: { href: string; label: string }
  /** Acciones de la página: una primaria como máximo. */
  actions?: React.ReactNode
  className?: string
}

/** Encabezado único de página: título 24/600, una línea de contexto y acciones a la derecha. */
export function PageHeader({ title, description, back, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-1.5', className)}>
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {description && <p className="max-w-[65ch] text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
