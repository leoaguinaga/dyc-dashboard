import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/api/server'
import { safeRedirectPath } from '@/lib/auth/redirect'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>
}) {
  const { redirect: requested } = await searchParams
  const redirectTo = safeRedirectPath(Array.isArray(requested) ? requested[0] : requested)

  // Con la sesión activa no tiene sentido mostrar el login: va directo al destino.
  if (await getSessionUser()) redirect(redirectTo)

  return <LoginForm redirectTo={redirectTo} />
}
