'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { entidadHref } from '@/lib/notificaciones'
import type { Notificacion } from '@/types/api'

const PAGE_SIZE = 20

export function NotificacionesTableClient({ initial }: { initial: Notificacion[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE)

  const noLeidas = items.filter((i) => !i.leida).length

  function handleClick(n: Notificacion) {
    if (!n.leida) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, leida: true } : i)))
      api.patch(`/notificaciones/${n.id}/leer`, {}).catch(() => {})
    }
    const href = entidadHref(n)
    if (href) router.push(href)
  }

  function handleMarcarTodas() {
    setItems((prev) => prev.map((i) => ({ ...i, leida: true })))
    api.post('/notificaciones/leer-todas', {}).catch(() => {})
  }

  async function handleCargarMas() {
    setLoadingMore(true)
    try {
      const next = await api.get<Notificacion[]>(
        `/notificaciones?limit=${PAGE_SIZE}&offset=${items.length}`,
      )
      setItems((prev) => [...prev, ...next])
      setHasMore(next.length === PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-3">
      {noLeidas > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarcarTodas}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="size-3.5" />
            Marcar todas leídas ({noLeidas})
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={cn(
              'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/60',
              !n.leida && 'bg-primary/5',
            )}
          >
            <span
              className={cn(
                'mt-1.5 size-1.5 shrink-0 rounded-full',
                n.leida ? 'bg-transparent' : 'bg-primary',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{n.titulo}</p>
              <p className="text-sm text-muted-foreground">{n.mensaje}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground/70">
              {formatDistanceToNow(new Date(n.creadoEn), { addSuffix: true, locale: es })}
            </span>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleCargarMas} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  )
}
