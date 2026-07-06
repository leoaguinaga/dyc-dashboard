import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function ProyectosPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
      <Link href="/proyectos/nuevo" className={buttonVariants()}>
        <Plus className="size-4" />
        Nuevo proyecto
      </Link>
    </div>
  )
}
