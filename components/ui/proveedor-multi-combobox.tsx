'use client'

import { useRef, useState, useMemo } from 'react'
import { ChevronsUpDown, Search, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import { CATEGORIAS_PROVEEDOR } from '@/lib/proveedores'
import type { Proveedor } from '@/types/api'

interface Props {
  proveedores: Proveedor[]
  selected: Set<string>
  onToggle: (id: string) => void
  error?: boolean
}

export function ProveedorMultiCombobox({ proveedores, selected, onToggle, error }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [width, setWidth] = useState<number | undefined>(undefined)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selectedList = proveedores.filter((p) => selected.has(p.id))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return proveedores
    return proveedores.filter((p) => p.razonSocial.toLowerCase().includes(q))
  }, [proveedores, search])

  const grouped = useMemo(() => {
    const byCategory: Record<string, Proveedor[]> = {}
    const none: Proveedor[] = []
    for (const p of filtered) {
      if (p.categoria) (byCategory[p.categoria] ??= []).push(p)
      else none.push(p)
    }
    const ordered: { label: string; items: Proveedor[] }[] = CATEGORIAS_PROVEEDOR
      .filter((c) => byCategory[c]?.length)
      .map((c) => ({ label: c, items: byCategory[c] }))
    if (none.length) ordered.push({ label: 'Sin categoría', items: none })
    return ordered
  }, [filtered])

  function handleOpenChange(next: boolean) {
    if (next && triggerRef.current) setWidth(triggerRef.current.offsetWidth)
    if (!next) setSearch('')
    setOpen(next)
  }

  return (
    <div className="space-y-2">
      {/* Chips de seleccionados */}
      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedList.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
            >
              {p.razonSocial}
              <button
                type="button"
                aria-label={`Quitar ${p.razonSocial}`}
                onClick={() => onToggle(p.id)}
                className="rounded text-primary/60 hover:text-primary transition-colors duration-[80ms]"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          ref={triggerRef}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm text-left',
            'ring-offset-background transition-colors duration-[120ms]',
            'hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            error && 'border-destructive',
            selected.size === 0 && 'text-muted-foreground',
          )}
        >
          <span className="truncate">
            {selected.size === 0
              ? 'Agregar proveedor…'
              : `${selected.size} proveedor${selected.size > 1 ? 'es' : ''} seleccionado${selected.size > 1 ? 's' : ''}`}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-0 overflow-hidden gap-0"
          style={{ width: width ? `${width}px` : undefined }}
        >
          {/* Buscador */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Lista agrupada */}
          <div className="max-h-64 overflow-y-auto py-1">
            {grouped.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              grouped.map(({ label, items }) => (
                <div key={label}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  {items.map((p) => {
                    const isSelected = selected.has(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onToggle(p.id)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm',
                          'outline-none transition-colors duration-[80ms] hover:bg-accent hover:text-accent-foreground',
                          isSelected && 'bg-accent',
                        )}
                      >
                        <Check className={cn('size-4 shrink-0 text-primary', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <span className="truncate font-medium">{p.razonSocial}</span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
