import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  backHref: string
  backLabel: string
  title: string
  /** Estado del documento mientras se registra: «Borrador», «Sin registrar». */
  estado: string
}

/** Encabezado común de los formularios de registro (requerimiento y compra simple). */
export function RegistroHeader({ backHref, backLabel, title, estado }: Props) {
  return (
    <div className="space-y-1">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{estado}</span>
      </div>
    </div>
  )
}
