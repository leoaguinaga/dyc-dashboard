import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { API_ORIGIN } from '@/lib/api/client'
import type { Cobro } from '@/types/api'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { MarcarCobradoCard } from './components/MarcarCobradoCard'

const ESTADO_LABEL: Record<Cobro['estadoEfectivo'], string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  cobrado: 'Cobrado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Cobro['estadoEfectivo'], string> = {
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  cobrado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

interface Props {
  params: Promise<{ id: string }>
}

function DatoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}

export default async function CobroDetailPage({ params }: Props) {
  const { id } = await params
  const cobro = await serverFetch<Cobro>(`/cobros/${id}`).catch(() => null)
  if (!cobro) notFound()

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="space-y-1">
        <Link href="/cobros" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-120">
          <ArrowLeft className="size-3.5" />
          Cobros
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">
            Cobro de{' '}
            <Link href={`/proyectos/${cobro.proyecto.id}`} className="hover:text-primary transition-colors duration-120">
              {cobro.proyecto.codigo ?? cobro.proyecto.nombre}
            </Link>
          </h1>
          <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[cobro.estadoEfectivo])}>
            {ESTADO_LABEL[cobro.estadoEfectivo]}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 grid gap-4 sm:grid-cols-2">
        <DatoCard label="Monto a cobrar" value={formatCurrency(cobro.monto)} />
        <DatoCard label="Fecha programada" value={formatDateOnly(cobro.fechaProgramada)} />
        {cobro.fechaCobrada && <DatoCard label="Fecha de cobro" value={formatDateOnly(cobro.fechaCobrada)} />}
        <DatoCard label="Registrado por" value={cobro.registradoPor.name} />
        {cobro.cobradoPor && <DatoCard label="Cobrado por" value={cobro.cobradoPor.name} />}
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acta de conformidad</h2>
        {cobro.actaConformidadUrl.endsWith('.pdf') ? (
          <a
            href={`${API_ORIGIN}${cobro.actaConformidadUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {cobro.actaConformidadNombre}
          </a>
        ) : (
          <a href={`${API_ORIGIN}${cobro.actaConformidadUrl}`} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${API_ORIGIN}${cobro.actaConformidadUrl}`}
              alt="Acta de conformidad"
              className="w-full max-w-sm rounded-lg border border-border"
            />
          </a>
        )}
      </div>

      {cobro.estado === 'pendiente' && <MarcarCobradoCard cobro={cobro} />}
    </div>
  )
}
