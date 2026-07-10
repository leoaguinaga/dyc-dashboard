'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, CheckCheck } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { entidadHref } from '@/lib/notificaciones'
import type { Notificacion } from '@/types/api'

const POLL_INTERVAL_MS = 45_000

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Notificacion[] | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshCount = useCallback(() => {
    api
      .get<{ count: number }>('/notificaciones/no-leidas/count')
      .then((r) => setCount(r.count))
      .catch(() => { })
  }, [])

  useEffect(() => {
    refreshCount()
    const id = setInterval(refreshCount, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refreshCount])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setLoading(true)
      api
        .get<Notificacion[]>('/notificaciones?limit=10')
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }
  }

  function handleItemClick(n: Notificacion) {
    if (!n.leida) {
      setItems((prev) => prev?.map((i) => (i.id === n.id ? { ...i, leida: true } : i)) ?? null)
      setCount((c) => Math.max(0, c - 1))
      api.patch(`/notificaciones/${n.id}/leer`, {}).catch(() => { })
    }
    const href = entidadHref(n)
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  function handleMarcarTodas() {
    setItems((prev) => prev?.map((i) => ({ ...i, leida: true })) ?? null)
    setCount(0)
    api.post('/notificaciones/leer-todas', {}).catch(() => { })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">Notificaciones</span>
          {count > 0 && (
            <button
              onClick={handleMarcarTodas}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              Marcar todas leídas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">Cargando…</div>
          )}
          {!loading && items?.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </div>
          )}
          {!loading &&
            items?.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={cn(
                  'flex w-full flex-col gap-0.5 border-b border-border/60 px-3 py-2.5 text-left last:border-0 hover:bg-muted/60',
                  !n.leida && 'bg-primary/5',
                )}
              >
                <div className="flex items-center gap-1.5">
                  {!n.leida && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="text-sm font-medium">{n.titulo}</span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{n.mensaje}</p>
                <span className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(n.creadoEn), { addSuffix: true, locale: es })}
                </span>
              </button>
            ))}
        </div>

        <Link
          href="/notificaciones"
          onClick={() => setOpen(false)}
          className="block border-t border-border px-3 py-2 text-center text-xs font-medium text-primary hover:underline"
        >
          Ver todas
        </Link>
      </PopoverContent>
    </Popover>
  )
}
