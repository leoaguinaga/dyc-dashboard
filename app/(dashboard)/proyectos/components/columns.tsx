'use client'

import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRight, CornerDownRight } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header'
import { cn, formatDateOnly } from '@/lib/utils'
import type { Proyecto } from '@/types/api'

export interface ProyectoTableRow extends Proyecto {
  children?: ProyectoTableRow[]
  isContextOnly?: boolean
}

const ESTADO_LABELS: Record<Proyecto['estado'], string> = {
  planificacion: 'Planificación',
  ejecucion: 'Ejecución',
  cierre: 'Cierre',
  liquidada: 'Liquidada',
}

const ESTADO_STYLES: Record<Proyecto['estado'], string> = {
  planificacion: 'bg-blue-500/15 text-blue-600',
  ejecucion: 'bg-chart-2/15 text-chart-2',
  cierre: 'bg-amber-500/15 text-amber-600',
  liquidada: 'bg-muted text-muted-foreground',
}

function getCliente(proyecto: Proyecto) {
  return proyecto.cliente?.nombreComercial ?? proyecto.cliente?.razonSocial ?? '---'
}

function getUbicacion(proyecto: Proyecto) {
  if (proyecto.ambitoGeografico === 'internacional') return 'Internacional'
  return proyecto.ciudad ?? 'Perú'
}

export const columns: ColumnDef<ProyectoTableRow>[] = [
  {
    accessorKey: 'codigo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {row.original.codigo ?? '---'}
      </span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => {
      const childCount = row.original.children?.length ?? 0
      const isStandaloneChild = row.depth === 0 && !!row.original.parentId

      return (
        <div
          className="flex min-w-52 items-start gap-1.5"
          style={{ paddingLeft: `${row.depth * 1.25}rem` }}
        >
          {row.getCanExpand() ? (
            <button
              type="button"
              onClick={row.getToggleExpandedHandler()}
              aria-expanded={row.getIsExpanded()}
              aria-label={`${row.getIsExpanded() ? 'Contraer' : 'Desplegar'} ${row.original.nombre}`}
              className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground outline-none transition-colors duration-[120ms] hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <ChevronRight
                className={cn(
                  'size-3.5 transition-transform duration-200 ease-out',
                  row.getIsExpanded() && 'rotate-90',
                )}
              />
            </button>
          ) : row.depth > 0 ? (
            <CornerDownRight className="mt-1 size-4 shrink-0 text-muted-foreground/60" />
          ) : (
            <span className="size-5 shrink-0" aria-hidden="true" />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/proyectos/${row.original.id}`}
                className="font-medium hover:underline underline-offset-4"
              >
                {row.original.nombre}
              </Link>
              {childCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {childCount} {childCount === 1 ? 'subproyecto' : 'subproyectos'}
                </span>
              )}
              {row.original.isContextOnly && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Contexto
                </span>
              )}
            </div>
            {isStandaloneChild && row.original.parent && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Subproyecto de {row.original.parent.nombre}
              </p>
            )}
          </div>
        </div>
      )
    },
  },
  {
    id: 'cliente',
    accessorFn: getCliente,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{getCliente(row.original)}</span>
    ),
  },
  {
    id: 'ubicacion',
    accessorFn: getUbicacion,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ubicación" />,
    cell: ({ row }) => <UbicacionCell proyecto={row.original} />,
  },
  {
    id: 'fechaInicio',
    accessorFn: (proyecto) =>
      proyecto.fechaInicio ? new Date(proyecto.fechaInicio).getTime() : null,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Inicio programado" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.fechaInicio ? formatDateOnly(row.original.fechaInicio) : '---'}
      </span>
    ),
  },
  {
    id: 'fechaFin',
    accessorFn: (proyecto) =>
      proyecto.fechaFin ? new Date(proyecto.fechaFin).getTime() : null,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fin programado" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.fechaFin ? formatDateOnly(row.original.fechaFin) : '---'}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => <EstadoBadge estado={row.original.estado} />,
  },
]

function UbicacionCell({ proyecto }: { proyecto: Proyecto }) {
  if (proyecto.ambitoGeografico === 'internacional') {
    return (
      <span className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600">
        Internacional
      </span>
    )
  }

  return <span className="text-muted-foreground">{proyecto.ciudad ?? 'Perú'}</span>
}

function EstadoBadge({ estado }: { estado: Proyecto['estado'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        ESTADO_STYLES[estado],
      )}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}
