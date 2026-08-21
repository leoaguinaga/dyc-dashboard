'use client'

import { useState } from 'react'
import { Pencil, Play, Trash2 } from 'lucide-react'
import type { HelpVideo } from '@/types/api'

interface Props {
  video: HelpVideo
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}

export function VideoCard({ video, canManage, onEdit, onDelete }: Props) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-white">
      <div className="relative aspect-video bg-muted">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex size-full items-center justify-center"
          >
            <img
              src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt={video.titulo}
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
            <span className="relative flex size-11 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform group-hover:scale-105">
              <Play className="size-4.5 fill-foreground text-foreground" />
            </span>
          </button>
        )}
      </div>

      <div className="space-y-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug">{video.titulo}</h3>
          {canManage && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={onEdit}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Editar video"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar video"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
        {video.descripcion && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{video.descripcion}</p>
        )}
      </div>
    </div>
  )
}
