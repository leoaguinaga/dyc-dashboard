'use client'

import { useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import type { Trabajador } from '@/types/api'

interface TrabajadorComboboxProps {
  trabajadores: Trabajador[]
  value: string
  onValueChange: (id: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TrabajadorCombobox({
  trabajadores,
  value,
  onValueChange,
  placeholder = 'Seleccionar trabajador…',
  className,
  disabled,
}: TrabajadorComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [width, setWidth] = useState<number | undefined>(undefined)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = trabajadores.find((t) => t.id === value)

  const filtered = search.trim()
    ? trabajadores.filter(
      (t) =>
        t.nombre.toLowerCase().includes(search.toLowerCase()) ||
        t.cargo?.toLowerCase().includes(search.toLowerCase()) ||
        t.dni.toLowerCase().includes(search.toLowerCase()),
    )
    : trabajadores

  function handleOpenChange(next: boolean) {
    if (next && triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth)
    }
    if (!next) setSearch('')
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        ref={triggerRef}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm text-left',
          'ring-offset-background transition-colors duration-[120ms]',
          'hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          className,
        )}
      >
        <span className="flex min-w-0 items-baseline gap-1.5 truncate">
          {selected ? (
            <>
              <span className="truncate font-medium text-foreground">{selected.nombre}</span>
              {selected.cargo && (
                <span className="shrink-0 text-xs text-muted-foreground">{selected.cargo}</span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <div className="ml-2 flex shrink-0 items-center gap-0.5">
          {selected && (
            <span
              role="button"
              aria-label="Limpiar selección"
              onClick={(e) => {
                e.stopPropagation()
                onValueChange('')
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-4 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-0 overflow-hidden gap-0"
        style={{ width: width ? `${width}px` : undefined }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, cargo o DNI…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onValueChange(t.id === value ? '' : t.id)
                  setOpen(false)
                  setSearch('')
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                  'outline-none transition-colors duration-[80ms] hover:bg-accent hover:text-accent-foreground',
                  value === t.id && 'bg-accent',
                )}
              >
                <Check className={cn('size-4 shrink-0', value === t.id ? 'opacity-100 text-primary' : 'opacity-0')} />
                <div className="min-w-0">
                  <p className="truncate font-medium leading-none">{t.nombre}</p>
                  {t.cargo && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.cargo}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
