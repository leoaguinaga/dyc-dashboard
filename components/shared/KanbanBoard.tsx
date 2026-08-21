'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanColumn<S extends string> {
  key: S
  label: string
  colorClass: string
}

interface KanbanBoardProps<T, S extends string> {
  items: T[]
  columns: KanbanColumn<S>[]
  getStatus: (item: T) => S
  getId: (item: T) => string
  renderCard: (item: T) => ReactNode
  emptyMessage?: string
}

export function KanbanBoard<T, S extends string>({
  items,
  columns,
  getStatus,
  getId,
  renderCard,
  emptyMessage = 'Sin resultados',
}: KanbanBoardProps<T, S>) {
  const grouped = useMemo(() => {
    const map = new Map<S, T[]>()
    for (const col of columns) map.set(col.key, [])
    for (const item of items) {
      map.get(getStatus(item))?.push(item)
    }
    return map
  }, [items, columns, getStatus])

  const [collapsed, setCollapsed] = useState<Set<S>>(
    () => new Set(columns.filter((col) => (grouped.get(col.key)?.length ?? 0) === 0).map((col) => col.key)),
  )

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const toggleCollapsed = (key: S) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-2">
      {columns.map((col) => {
        const colItems = grouped.get(col.key) ?? []
        const isCollapsed = collapsed.has(col.key)

        if (isCollapsed) {
          return (
            <button
              key={col.key}
              type="button"
              onClick={() => toggleCollapsed(col.key)}
              className="flex w-10 shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-card py-3 shadow-sm transition-colors hover:bg-muted/40"
            >
              <ChevronRight className="size-4 text-muted-foreground" />
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
                  col.colorClass,
                )}
              >
                {colItems.length}
              </span>
              <span
                className="mt-1 whitespace-nowrap text-xs font-medium text-foreground"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {col.label}
              </span>
            </button>
          )
        }

        return (
          <div
            key={col.key}
            className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium',
                    col.colorClass,
                  )}
                >
                  {col.label}
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                  {colItems.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleCollapsed(col.key)}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Contraer columna ${col.label}`}
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            <div className="flex max-h-[calc(100vh-16rem)] flex-col gap-2 overflow-y-auto p-2">
              {colItems.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground/50">—</p>
              ) : (
                colItems.map((item) => <div key={getId(item)}>{renderCard(item)}</div>)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
