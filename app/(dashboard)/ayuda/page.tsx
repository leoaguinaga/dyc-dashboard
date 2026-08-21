import { serverFetch } from '@/lib/api/server'
import type { HelpVideo } from '@/types/api'
import { AyudaBoard } from './components/AyudaBoard'

export default async function AyudaPage() {
  const videos = await serverFetch<HelpVideo[]>('/ayuda/videos')

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ayuda</h1>
        <p className="text-sm text-muted-foreground">
          Videos tutoriales de cada módulo, según tu rol en el sistema.
        </p>
      </div>
      <AyudaBoard initialVideos={videos} />
    </div>
  )
}
