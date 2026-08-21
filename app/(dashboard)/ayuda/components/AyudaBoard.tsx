'use client'

import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import type { HelpVideo } from '@/types/api'
import { VideoCard } from './VideoCard'
import { VideoFormDialog } from './VideoFormDialog'

interface Props {
  initialVideos: HelpVideo[]
}

export function AyudaBoard({ initialVideos }: Props) {
  const { data: session } = useSession()
  const canManage = session?.user?.role === 'admin_ti'

  const [videos, setVideos] = useState(initialVideos)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HelpVideo | null>(null)

  const grupos = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? videos.filter(
        (v) => v.titulo.toLowerCase().includes(q) || v.descripcion?.toLowerCase().includes(q),
      )
      : videos

    const byModulo = new Map<string, HelpVideo[]>()
    for (const v of filtered) {
      if (!byModulo.has(v.modulo)) byModulo.set(v.modulo, [])
      byModulo.get(v.modulo)!.push(v)
    }
    return [...byModulo.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [videos, search])

  async function refresh() {
    const fresh = await api.get<HelpVideo[]>('/ayuda/videos')
    setVideos(fresh)
    setFormOpen(false)
    setEditing(null)
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(video: HelpVideo) {
    setEditing(video)
    setFormOpen(true)
  }

  async function handleDelete(video: HelpVideo) {
    if (!confirm(`¿Eliminar el video "${video.titulo}"?`)) return
    await api.delete(`/ayuda/videos/${video.id}`)
    setVideos((prev) => prev.filter((v) => v.id !== video.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar un video…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Subir video
          </Button>
        )}
      </div>

      {grupos.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {videos.length === 0 ? 'Todavía no hay videos de ayuda.' : 'Sin resultados para tu búsqueda.'}
        </p>
      )}

      {grupos.map(([modulo, items]) => (
        <div key={modulo} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Modulo de <span className='lowercase'>{modulo}</span></h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                canManage={canManage}
                onEdit={() => openEdit(video)}
                onDelete={() => handleDelete(video)}
              />
            ))}
          </div>
        </div>
      ))}

      <VideoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        video={editing}
        onSaved={refresh}
      />
    </div>
  )
}
