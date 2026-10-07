import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/api/server'

export default async function Home() {
  redirect((await getSessionUser()) ? '/dashboard' : '/login')
}
