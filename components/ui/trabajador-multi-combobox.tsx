'use client'

import { useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import type { Trabajador } from '@/types/api'

interface TrabajadorMultiComboboxProps {
  trabajadores: Trabajador[]
  value: string[]
  onValueChange: (ids: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TrabajadorMultiCombobox({
  trabajadores,
  value,
  onValueChange,
  placeholder = 'Seleccionar trabajadores…',
  className,
  disabled,
}: TrabajadorMultiComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [width, setWidth] = useState<number | undefined>(undefined)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selectedSet = new Set(value)

  const filtered = search.trim()
    ? trabajadores.filter(
      (t) =>
        t.nombre.toLowerCase().includes(search.toLowerCase()) ||
        t.cargo?.toLowerCase().includes(search.toLowerCase()) ||
        t.dni.toLowerCase().includes(search.toLowerCase()),
    )
    : trabajadores

  const allFilteredSelected = filtered.length > 0 && filtered.every((t) => selectedSet.has(t.id))

  function handleOpenChange(next: boolean) {
    if (next && triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth)
    }
    if (!next) setSearch('')
    setOpen(next)
  }

  function toggle(id: string) {
    onValueChange(selectedSet.has(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((t) => t.id))
      onValueChange(value.filter((v) => !filteredIds.has(v)))
    } else {
      const merged = new Set(value)
      filtered.forEach((t) => merged.add(t.id))
      onValueChange([...merged])
    }
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
          value.length === 0 && 'text-muted-foreground',
          className,
        )}
      >
        <span className="truncate">
          {value.length === 0
            ? placeholder
            : `${value.length} trabajador${value.length === 1 ? '' : 'es'} seleccionado${value.length === 1 ? '' : 's'}`}
        </span>
        <div className="ml-2 flex shrink-0 items-center gap-0.5">
          {value.length > 0 && (
            <span
              role="button"
              aria-label="Limpiar selección"
              onClick={(e) => {
                e.stopPropagation()
                onValueChange([])
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

        {filtered.length > 0 && (
          <button
            type="button"
            onClick={toggleAllFiltered}
            className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Check className={cn('size-3.5 shrink-0', allFilteredSelected ? 'opacity-100 text-primary' : 'opacity-0')} />
            {allFilteredSelected ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        )}

        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                  'outline-none transition-colors duration-[80ms] hover:bg-accent hover:text-accent-foreground',
                  selectedSet.has(t.id) && 'bg-accent',
                )}
              >
                <Check className={cn('size-4 shrink-0', selectedSet.has(t.id) ? 'opacity-100 text-primary' : 'opacity-0')} />
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
