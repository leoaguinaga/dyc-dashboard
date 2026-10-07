import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SidebarNav } from './components/sidebar'
import { Navbar } from './components/navbar'
import { ImpersonationBanner, type ImpersonationInfo } from './components/ImpersonationBanner'
import { ModuloGate } from './components/ModuloGate'
import { getSessionUser, serverFetch } from '@/lib/api/server'
import { loginUrl } from '@/lib/auth/redirect'
import { AccesosProvider } from '@/lib/accesos'
import type { MisModulos } from '@/types/api'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()

  // Sin sesión se recuerda la URL pedida (la fija proxy.ts) para volver a ella tras el login.
  if (!user) redirect(loginUrl((await headers()).get('x-pathname')))

  // Si falla, el menú cae en el filtro por rol de siempre.
  const excepciones = await serverFetch<MisModulos>('/rbac/modulos/mios').catch(() => ({}))

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
    <AccesosProvider excepciones={excepciones}>
      <div className="flex h-dvh min-w-0 overflow-hidden">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar />
          {impersonationInfo && <ImpersonationBanner info={impersonationInfo} />}
          <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full min-w-0 p-3 sm:p-5">
              <ModuloGate role={user.role}>{children}</ModuloGate>
            </div>
          </main>
        </div>
      </div>
    </AccesosProvider>
  )
}
