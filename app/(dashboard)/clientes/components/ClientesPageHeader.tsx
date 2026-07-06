import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function ClientesPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
      <Link href="/clientes/nuevo" className={buttonVariants()}>
        <Plus className="size-4" />
        Nuevo cliente
      </Link>
    </div>
  )
}
