'use client'

import { cn } from '@/lib/utils'

interface Option<T extends string> {
  value: T
  label: string
  description?: string
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<Option<T>>
  /** Id del texto que rotula el grupo. */
  labelledBy: string
  className?: string
}

/** Grupo de botones excluyentes; el estado activo se anuncia con `aria-pressed`, no solo con color. */
export function SegmentedControl<T extends string>({ value, onChange, options, labelledBy, className }: Props<T>) {
  return (
    <div role="group" aria-labelledby={labelledBy} className={cn('flex overflow-hidden rounded-lg border border-input bg-white', className)}>
      {options.map((o) => {
        const activo = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-9 flex-1 flex-col items-start justify-center border-r border-input px-3 py-1.5 text-left text-sm transition-colors duration-[120ms] last:border-r-0',
              'focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
              activo ? 'bg-primary/5 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <span>{o.label}</span>
            {o.description && <span className="text-xs font-normal opacity-80">{o.description}</span>}
          </button>
        )
      })}
    </div>
  )
}
