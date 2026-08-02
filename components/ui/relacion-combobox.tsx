'use client'

import { useMemo, useState } from 'react'
import { ChevronsUpDown, Search, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import { ENDPOINT_POR_ENTIDAD_RELACION } from '@/lib/reportes/tipos'

interface RegistroRelacion {
  id: string
  [key: string]: unknown
}

interface Props {
  entidadRelacion: string
  value?: string
  onValueChange: (id: string | undefined) => void
  placeholder?: string
  error?: boolean
}

export function RelacionCombobox({ entidadRelacion, value, onValueChange, placeholder, error }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<RegistroRelacion[]>([])
  const [loading, setLoading] = useState(false)

  const config = ENDPOINT_POR_ENTIDAD_RELACION[entidadRelacion]

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && config && items.length === 0) {
      setLoading(true)
      api
        .get<RegistroRelacion[]>(config.endpoint)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }
  }

  const seleccionado = items.find((i) => i.id === value)

  const filtered = useMemo(() => {
    if (!config) return []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => String(i[config.labelField] ?? '').toLowerCase().includes(q))
  }, [items, search, config])

  if (!config) return null

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          'flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          error && 'border-destructive ring-3 ring-destructive/20',
          !seleccionado && 'text-muted-foreground',
        )}
      >
        <span className="truncate">
          {seleccionado ? String(seleccionado[config.labelField]) : (placeholder ?? 'Seleccionar…')}
        </span>
        <span className="flex items-center gap-1">
          {seleccionado && (
            <X
              className="size-3.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onValueChange(undefined)
              }}
            />
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="w-72 p-0 overflow-hidden gap-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.map((item) => {
              const isSelected = item.id === value
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onValueChange(item.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm',
                    'outline-none transition-colors duration-[80ms] hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent',
                  )}
                >
                  <Check className={cn('size-4 shrink-0 text-primary', isSelected ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{String(item[config.labelField] ?? item.id)}</span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
