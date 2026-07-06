'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Package, Plus, Search, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Almacen } from '@/types/api'

const TIPO_LABELS = { fijo: 'Fijo', temporal: 'Temporal' } as const
const TIPO_COLORS = {
  fijo: 'bg-primary/10 text-primary',
  temporal: 'bg-chart-2/15 text-chart-2',
} as const

interface AlmacenesTableClientProps {
  initialAlmacenes: Almacen[]
}

export function AlmacenesTableClient({ initialAlmacenes }: AlmacenesTableClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('all')

  const filteredAlmacenes = useMemo(() => {
    return initialAlmacenes.filter((a) => {
      const matchesSearch =
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.ciudad && a.ciudad.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.notas && a.notas.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesTipo = tipoFilter === 'all' || a.tipo === tipoFilter

      return matchesSearch && matchesTipo
    })
  }, [initialAlmacenes, searchTerm, tipoFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setTipoFilter('all')
  }

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2 left-3 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar almacén por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-48">
          <Select value={tipoFilter} onValueChange={(val) => setTipoFilter(val ?? 'all')}>
            <SelectTrigger className="h-9 w-full">
              <p>Tipo almacén</p>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Fijo">Fijo</SelectItem>
              <SelectItem value="Temporal">Temporal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline">
          <Link href="/almacenes/items" className='flex gap-x-1'>
            <Package className="size-4 mt-0.5" />
            Ver catálogo de ítems
          </Link>
        </Button>
        <Button>
          <Link href="/almacenes/nuevo" className='flex gap-x-1'>
            <Plus className="size-4 mt-0.5" />
            Crear almacén
          </Link>
        </Button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
        {filteredAlmacenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No se encontraron almacenes con los criterios de búsqueda.
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Nombre', 'Tipo', 'Ciudad', 'Estado'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAlmacenes.map((a) => (
                <tr
                  key={a.id}
                  className="transition-colors duration-[120ms] hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/almacenes/${a.id}`} className="hover:underline underline-offset-4">
                      {a.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        TIPO_COLORS[a.tipo]
                      )}
                    >
                      {TIPO_LABELS[a.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.ciudad ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        a.activo
                          ? 'bg-chart-2/15 text-chart-2'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
