import { cookies } from 'next/headers'
import type { User } from '@/types/api'

const API_URL = process.env.API_URL ?? 'http://localhost:3333/api'

export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies()
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/** Usuario de la sesión actual, o `null` si no hay sesión válida. */
export function getSessionUser() {
  return serverFetch<User>('/users/me').catch(() => null)
}
