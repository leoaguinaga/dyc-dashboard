import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, CalendarDays, Pencil, Briefcase, Tag } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ContactosProveedorSection } from './components/ContactosProveedorSection'
import { ItemsSolicitadosSection } from './components/ItemsSolicitadosSection'
import { HistorialCotizacionesSection } from './components/HistorialCotizacionesSection'
import { EvaluacionProveedorSection } from './components/EvaluacionProveedorSection'
import type { Proveedor, ItemSolicitadoProveedor, CotizacionConHistorial, ProveedorEvaluacion } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ProveedorDetailPage({ params }: Props) {
  const { id } = await params
  const [result, itemsSolicitados, cotizaciones, evaluacion] = await Promise.all([
    serverFetch<Proveedor>(`/proveedores/${id}`).catch((e: Error) => e),
    serverFetch<ItemSolicitadoProveedor[]>(`/proveedores/${id}/items-solicitados`).catch(() => [] as ItemSolicitadoProveedor[]),
    serverFetch<CotizacionConHistorial[]>(`/proveedores/${id}/cotizaciones`).catch(() => [] as CotizacionConHistorial[]),
    serverFetch<ProveedorEvaluacion>(`/proveedores/${id}/evaluacion`).catch(
      () => null as ProveedorEvaluacion | null,
    ),
  ])

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el proveedor.</p>
  }

  const p = result
  const initials = p.razonSocial
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a proveedores
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground select-none">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{p.razonSocial}</h1>
              {p.ruc && (
                <p className="text-sm text-muted-foreground font-mono">RUC {p.ruc}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                p.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
              )}
            >
              {p.activo ? 'Activo' : 'Inactivo'}
            </span>
            <Link
              href={`/proveedores/${id}/editar`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <Pencil className="size-3.5" />
              Editar
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Información */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Información
          </h2>
          <dl className="space-y-3 text-sm">
            {p.rubro && (
              <InfoRow icon={<Briefcase className="size-4" />} label="Rubro" value={p.rubro} />
            )}
            {p.categoria && (
              <InfoRow icon={<Tag className="size-4" />} label="Categoría" value={p.categoria} />
            )}
            {p.direccion && (
              <InfoRow icon={<MapPin className="size-4" />} label="Dirección" value={p.direccion} />
            )}
            {p.creadoEn && (
              <InfoRow icon={<CalendarDays className="size-4" />} label="Registrado" value={fmt(p.creadoEn)} />
            )}
            {!p.rubro && !p.categoria && !p.direccion && (
              <p className="text-muted-foreground">Sin información adicional</p>
            )}
          </dl>
        </div>

        {/* Contactos */}
        <div className="lg:col-span-2">
          <ContactosProveedorSection
            proveedorId={p.id}
            contactos={p.contactos ?? []}
          />
        </div>

        {/* Evaluación */}
        {evaluacion && <EvaluacionProveedorSection evaluacion={evaluacion} />}

        {/* Ítems solicitados */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-3">
          <ItemsSolicitadosSection items={itemsSolicitados} />
        </div>

        {/* Historial de cotizaciones */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-3">
          <HistorialCotizacionesSection cotizaciones={cotizaciones} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={cn('font-medium', mono && 'font-mono')}>{value}</dd>
      </div>
    </div>
  )
}
