'use client'

import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'

interface Props {
  proyectoId: string
}

export function TomarAsistenciaButton({ proyectoId }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role

  if (role === 'pdr') return null

  return (
    <Link href={`/proyectos/${proyectoId}/asistencia`}>
      <Button variant="outline" className="gap-1.5">
        <ClipboardCheck className="size-3.5" />
        Tomar asistencia
      </Button>
    </Link>
  )
}
