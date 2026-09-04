'use client'

import { useMemo, useState, type ReactNode } from 'react'
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
  scrollRef?: React.Ref<HTMLDivElement>
}

export function KanbanBoard<T, S extends string>({
  items,
  columns,
  getStatus,
  getId,
  renderCard,
  emptyMessage = 'Sin resultados',
  scrollRef,
}: KanbanBoardProps<T, S>) {
  const grouped = useMemo(() => {
    const map = new Map<S, T[]>()
    for (const col of columns) map.set(col.key, [])
    for (const item of items) {
      map.get(getStatus(item))?.push(item)
    }
    return map
  }, [items, columns, getStatus])

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex items-start gap-3 overflow-x-hidden pb-2 scroll-smooth">
      {columns.map((col) => {
        const colItems = grouped.get(col.key) ?? []

        return (
          <div
            key={col.key}
            className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <div className="flex min-w-0 w-full items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium',
                    col.colorClass,
                  )}
                >
                  {col.label}
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {colItems.length}
                </span>
              </div>
            </div>
            <div className="flex max-h-[68.5vh] flex-col gap-2 overflow-y-auto p-2">
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
