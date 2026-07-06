import { redirect } from 'next/navigation'
import { SidebarNav } from './components/sidebar'
import { Navbar } from './components/navbar'
import { serverFetch } from '@/lib/api/server'
import type { User } from '@/types/api'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await serverFetch<User>('/users/me').catch(() => null)

  if (!user) redirect('/login')

  return (
    <div className="flex h-dvh overflow-hidden">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full p-5">{children}</div>
        </main>
      </div>
    </div>
  )
}
