'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import type { AuditLogEntry, AuditLogPage } from '@/types/api'

interface Props {
  userId: string
  initial: AuditLogPage
}

const METHOD_COLORS: Record<string, string> = {
  POST: 'bg-chart-2/15 text-chart-2',
  PATCH: 'bg-amber-500/10 text-amber-600',
  PUT: 'bg-amber-500/10 text-amber-600',
  DELETE: 'bg-destructive/10 text-destructive',
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function AuditLogSection({ userId, initial }: Props) {
  const [items, setItems] = useState<AuditLogEntry[]>(initial.items)
  const [page, setPage] = useState(initial.page)
  const [total] = useState(initial.total)
  const [loading, setLoading] = useState(false)

  const hasMore = items.length < total

  const loadMore = async () => {
    setLoading(true)
    try {
      const next = page + 1
      const data = await api.get<AuditLogPage>(
        `/users/${userId}/auditoria?page=${next}&pageSize=${initial.pageSize}`,
      )
      setItems((prev) => [...prev, ...data.items])
      setPage(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Registro de auditoría
        </h2>
        <span className="text-xs text-muted-foreground">{total} eventos registrados</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin eventos de auditoría registrados.</p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {items.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex w-16 shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                      METHOD_COLORS[entry.method] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {entry.method}
                  </span>
                  <span className="truncate font-mono text-xs text-foreground/80">{entry.path}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {entry.statusCode && (
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        entry.statusCode >= 400 ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {entry.statusCode}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmtDateTime(entry.creadoEn)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loading} className="gap-1.5">
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  `Cargar más (${items.length} de ${total})`
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
