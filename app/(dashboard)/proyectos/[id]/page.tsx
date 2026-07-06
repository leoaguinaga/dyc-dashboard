import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Building2,
  Pencil,
  Globe,
  FileText,
  FolderTree,
} from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProyectoTrabajadoresSection } from './components/ProyectoTrabajadoresSection'
import { ProyectoHitosSection } from './components/ProyectoHitosSection'
import { ProyectoOrdenesCompraSection } from './components/ProyectoOrdenesCompraSection'
import { ProyectoPagosPendientesSection } from './components/ProyectoPagosPendientesSection'
import type { Proyecto, Trabajador } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const ESTADO_STYLES: Record<string, string> = {
  planificacion: 'bg-blue-500/15 text-blue-600',
  ejecucion: 'bg-chart-2/15 text-chart-2',
  cierre: 'bg-amber-500/15 text-amber-600',
  liquidada: 'bg-muted text-muted-foreground',
}

const ESTADO_LABELS: Record<string, string> = {
  planificacion: 'Planificacion',
  ejecucion: 'Ejecucion',
  cierre: 'Cierre',
  liquidada: 'Liquidada',
}

const AMBITO_LABELS: Record<string, string> = {
  local: 'Local',
  nacional: 'Nacional',
  internacional: 'Internacional',
}

function fmt(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'

export default async function ProyectoDetailPage({ params }: Props) {
  const { id } = await params

  const [result, trabajadores] = await Promise.all([
    serverFetch<Proyecto>(`/proyectos/${id}`).catch((e: Error) => e),
    serverFetch<Trabajador[]>('/trabajadores').catch(() => [] as Trabajador[]),
  ])

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el proyecto.</p>
  }

  const o = result

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a proyectos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className='flex flex-wrap gap-3 items-center'>
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
              <Building2 className="size-5.5 text-muted-foreground" />
            </div>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className="text-2xl font-semibold tracking-tight">{o.nombre} {o.cliente && (
                  <span className="text-muted-foreground">
                    ({o.cliente.nombreComercial ?? o.cliente.razonSocial})
                  </span>
                )}</h1>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                    ESTADO_STYLES[o.estado] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {ESTADO_LABELS[o.estado] ?? o.estado}
                </span>
              </div>
              {o.codigo && (
                <p className="text-sm text-muted-foreground font-mono">{o.codigo} · Fecha prog. {fmt(o.fechaInicio) ?? '—'} → {fmt(o.fechaFin) ?? '—'}</p>
              )}
              {o.parent && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Subproyecto de{' '}
                  <Link href={`/proyectos/${o.parent.id}`} className="text-primary hover:underline underline-offset-2">
                    {o.parent.nombre}
                  </Link>
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/proyectos/${id}/editar`}
          >
            <Button
              variant="link"
              className='text-muted-foreground'
            >
              Editar proyecto
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">

        {/* Identificacion */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Identificacion</h2>
          <dl className="space-y-3 text-sm">
            {(o.fechaInicioReal || o.fechaFinReal) && (
              <InfoRow icon={<Calendar className="size-4" />} label="Fechas reales">
                <span className="font-medium tabular-nums">
                  {fmt(o.fechaInicioReal) ?? '—'} → {fmt(o.fechaFinReal) ?? '—'}
                </span>
              </InfoRow>
            )}
            {o.notaInicioReal && (
              <InfoRow icon={<FileText className="size-4" />} label="Nota inicio real">
                <span className="text-muted-foreground">{o.notaInicioReal}</span>
              </InfoRow>
            )}
            {!o.cliente && !o.fechaInicio && !o.fechaFin && !o.fechaInicioReal && !o.fechaFinReal && (
              <p className="text-muted-foreground">Sin informacion adicional</p>
            )}
            {o.ambitoGeografico && (
              <InfoRow icon={<Globe className="size-4" />} label="Ambito">
                <span className="font-medium">{AMBITO_LABELS[o.ambitoGeografico] ?? o.ambitoGeografico}</span>
              </InfoRow>
            )}
            {o.ambitoGeografico === 'local' && (
              <>
                <InfoRow icon={<MapPin className="size-4" />} label="Direccion">
                  <span className="font-medium">{o.direccion} {o.comuna && (`${o.comuna}, `)}{o.ciudad && (`, ${o.ciudad}`)}</span>
                </InfoRow>
              </>
            )}
            {o.ambitoGeografico !== 'local' && o.direccion && (
              <InfoRow icon={<MapPin className="size-4" />} label="Direccion">
                <span className="font-medium">{o.direccion}</span>
              </InfoRow>
            )}
            {!o.ambitoGeografico && !o.ciudad && !o.direccion && !o.comuna && (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <MapPin className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Sin ubicacion registrada</p>
              </div>
            )}
          </dl>
        </div>

        {/* Personas */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-3 col-span-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Personas asignadas</h2>
          {!o.coordinadorEmpresa && !o.coordinadorCliente && !o.ejecutor && !o.prevencionista ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <Users className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin personas asignadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {o.coordinadorEmpresa && (
                <PersonaCard
                  rol="Coordinador empresa"
                  nombre={o.coordinadorEmpresa.nombre}
                  puesto={o.coordinadorEmpresa.cargo}
                  href={`/trabajadores/${o.coordinadorEmpresa.id}`}
                  email={o.coordinadorEmpresa.email}
                  telefono={o.coordinadorEmpresa.telefono}
                />
              )}
              {o.coordinadorCliente && (
                <PersonaCard
                  rol="Coordinador cliente"
                  nombre={o.coordinadorCliente.nombre}
                  puesto={o.coordinadorCliente.cargo}
                  href={`/clientes/${o.cliente?.id}`}
                  email={o.coordinadorCliente.email}
                  telefono={o.coordinadorCliente.telefono}
                />
              )}
              {o.ejecutor && (
                <PersonaCard
                  rol="Ejecutor"
                  nombre={o.ejecutor.nombre}
                  puesto={o.ejecutor.cargo}
                  href={`/trabajadores/${o.ejecutor.id}`}
                  email={o.ejecutor.email}
                  telefono={o.ejecutor.telefono}
                />
              )}
              {o.prevencionista && (
                <PersonaCard
                  rol="Prevencionista"
                  nombre={o.prevencionista.nombre}
                  puesto={o.prevencionista.cargo}
                  href={`/trabajadores/${o.prevencionista.id}`}
                  email={o.prevencionista.email}
                  telefono={o.prevencionista.telefono}
                />
              )}
            </div>
          )}
        </div>

        {/* Subproyectos */}
        {o.subproyectos && o.subproyectos.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className={sectionTitleCn}>Subproyectos ({o.subproyectos.length})</h2>
            <div className="space-y-2">
              {o.subproyectos.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/proyectos/${sub.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2">
                    <FolderTree className="size-4 text-muted-foreground" />
                    <div>
                      {sub.codigo && <span className="font-mono text-xs text-muted-foreground mr-2">{sub.codigo}</span>}
                      <span className="text-sm font-medium">{sub.nombre}</span>
                    </div>
                  </div>
                  <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_STYLES[sub.estado] ?? 'bg-muted text-muted-foreground')}>
                    {ESTADO_LABELS[sub.estado] ?? sub.estado}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Hitos */}
        <ProyectoHitosSection
          proyectoId={o.id}
          initialHitos={o.hitos ?? []}
          trabajadores={trabajadores}
        />

        {/* Trabajadores */}
        <ProyectoTrabajadoresSection
          proyectoId={o.id}
          initialItems={o.trabajadores ?? []}
          todos={trabajadores}
        />

        {/* Órdenes de compra */}
        <ProyectoOrdenesCompraSection proyectoId={o.id} />

        {/* Pagos pendientes */}
        <ProyectoPagosPendientesSection proyectoId={o.id} />
      </div>
    </div>
  )
}

function PersonaCard({
  rol,
  nombre,
  puesto,
  href,
  email,
  telefono,
}: {
  rol: string
  nombre: string
  puesto?: string
  href?: string
  email?: string
  telefono?: string
}) {
  return (
    <div className="flex flex-col py-3 border rounded-lg p-3 space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{rol}</p>
      <div className="flex flex-wrap items-baseline gap-1.5">
        {href ? (
          <Link href={href} className="text-sm font-medium hover:underline underline-offset-4">
            {nombre}
          </Link>
        ) : (
          <span className="text-sm font-medium">{nombre}</span>
        )}
        {puesto && (
          <span className="text-xs text-muted-foreground">{puesto}</span>
        )}
      </div>
      {(email || telefono) && (
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
            >
              {email}
            </a>
          )}
          {telefono && (
            <span className="text-xs text-muted-foreground font-mono">{telefono}</span>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  )
}
