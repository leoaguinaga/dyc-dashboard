import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function ProveedoresPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
      <Link href="/proveedores/nuevo" className={buttonVariants()}>
        <Plus className="size-4" />
        Nuevo proveedor
      </Link>
    </div>
  )
}
