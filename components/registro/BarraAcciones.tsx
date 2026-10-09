import { cn } from '@/lib/utils'

interface Props {
  /** Estado del formulario: «Faltan N datos por completar» o el conteo de lo registrado. */
  mensaje: React.ReactNode
  hayErrores: boolean
  /** Dato que debe verse siempre (p. ej. el total en móvil). */
  extra?: React.ReactNode
  children: React.ReactNode
}

export function BarraAcciones({ mensaje, hayErrores, extra, children }: Props) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <p
        className={cn('mr-auto text-xs', hayErrores ? 'font-medium text-destructive' : 'text-muted-foreground')}
        aria-live="polite"
      >
        {mensaje}
      </p>
      {extra}
      {children}
    </div>
  )
}
