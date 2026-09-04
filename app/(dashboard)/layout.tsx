import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SidebarNav } from './components/sidebar'
import { Navbar } from './components/navbar'
import { ImpersonationBanner, type ImpersonationInfo } from './components/ImpersonationBanner'
import { serverFetch } from '@/lib/api/server'
import type { User } from '@/types/api'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await serverFetch<User>('/users/me').catch(() => null)

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const impersonationCookie =
    cookieStore.get('impersonation_info') ??
    cookieStore.get('better-auth.impersonation_info') ??
    cookieStore.get('__Secure-better-auth.impersonation_info')

  let impersonationInfo: ImpersonationInfo | null = null
  if (impersonationCookie?.value) {
    try {
      impersonationInfo = JSON.parse(decodeURIComponent(impersonationCookie.value))
    } catch {
      impersonationInfo = null
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        {impersonationInfo && <ImpersonationBanner info={impersonationInfo} />}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full p-5">{children}</div>
        </main>
      </div>
    </div>
  )
}

