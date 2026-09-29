import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { RegistrarDesdeHojaForm } from './RegistrarDesdeHojaForm'
import type { Proyecto } from '@/types/api'

export default async function RegistrarDesdeHojaPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])
  const obras = proyectos.filter((p) => (p.turnoConfigs ?? []).some((c) => c.activo))

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-2">
        <Link
          href="/asistencia"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a Asistencia
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Registrar desde hoja</h1>
          <p className="text-sm text-muted-foreground">
            Carga una jornada desde la hoja física firmada (SIG-FR-003). Queda cerrada y marcada como “Desde hoja”.
          </p>
        </div>
      </div>
      <RegistrarDesdeHojaForm obras={obras} />
    </div>
  )
}
