import { cn } from '@/lib/utils'

interface Props {
  id: string
  title: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Tarjeta de sección con título asociado (`aria-labelledby`). */
export function RegistroSection({ id, title, actions, className, children }: Props) {
  return (
    <section aria-labelledby={id} className={cn('rounded-xl border border-border bg-white p-4 sm:p-5', className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-sm font-medium">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}
