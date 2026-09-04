import { serverFetch } from '@/lib/api/server'
import type { HelpVideo } from '@/types/api'
import { AyudaTabsContainer } from './components/AyudaTabsContainer'

export default async function AyudaPage() {
  const videos = await serverFetch<HelpVideo[]>('/ayuda/videos').catch(() => [] as HelpVideo[])

  return <AyudaTabsContainer initialVideos={videos} />
}
