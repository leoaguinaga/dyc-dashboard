import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, HardHat, Mail, Phone, Briefcase, ShieldCheck, ShieldOff, CalendarDays, Pencil } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Trabajador } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const ROLE_LABELS: Record<string, string> = {
  supervisor: 'Supervisor',
  logistica: 'Logística',
  gerencia: 'Gerencia',
  administrador: 'Administrador',
}

const ESTADO_PROYECTO: Record<string, string> = {
  planificacion: 'bg-blue-500/15 text-blue-600',
  ejecucion: 'bg-chart-2/15 text-chart-2',
  cierre: 'bg-amber-500/15 text-amber-600',
  liquidada: 'bg-muted text-muted-foreground',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function TrabajadorDetailPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<Trabajador>(`/trabajadores/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el trabajador.</p>
  }

  const t = result
  const initials = t.nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/trabajadores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a trabajadores
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground select-none">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t.nombre}</h1>
              <p className="text-sm text-muted-foreground font-mono">DNI {t.dni}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                t.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
              )}
            >
              {t.activo ? 'Activo' : 'Inactivo'}
            </span>
            <Link
              href={`/trabajadores/${id}/editar`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <Pencil className="size-3.5" />
              Editar
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Datos personales */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Información
          </h2>
          <dl className="space-y-3 text-sm">
            {t.cargo && (
              <InfoRow icon={<Briefcase className="size-4" />} label="Cargo" value={t.cargo} />
            )}
            {t.telefono && (
              <InfoRow icon={<Phone className="size-4" />} label="Teléfono" value={t.telefono} mono />
            )}
            {t.email && (
              <InfoRow icon={<Mail className="size-4" />} label="Email" value={t.email} />
            )}
            {t.creadoEn && (
              <InfoRow icon={<CalendarDays className="size-4" />} label="Alta" value={fmt(t.creadoEn)} />
            )}
            {!t.cargo && !t.telefono && !t.email && (
              <p className="text-muted-foreground">Sin información adicional</p>
            )}
          </dl>
        </div>

        {/* Acceso al sistema */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acceso al sistema
          </h2>
          {t.user ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-chart-2 shrink-0" />
                <span className="font-medium text-chart-2">Con acceso</span>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Rol</dt>
                  <dd className="mt-0.5 font-medium capitalize">
                    {ROLE_LABELS[t.user.role ?? ''] ?? t.user.role ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email de acceso</dt>
                  <dd className="mt-0.5 font-medium break-all">{t.user.email}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <ShieldOff className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sin acceso al sistema</p>
            </div>
          )}
        </div>

        {/* Proyectos asignados */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Proyectos asignados ({t.proyectos?.length ?? 0})
          </h2>

          {!t.proyectos?.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
              <HardHat className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Sin proyectos asignados</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyecto</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingreso</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {t.proyectos.map((asig) => (
                    <tr key={asig.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/proyectos/${asig.proyecto.id}`}
                          className="font-medium hover:underline underline-offset-2"
                        >
                          {asig.proyecto.nombre}
                        </Link>
                        {asig.proyecto.codigo && (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{asig.proyecto.codigo}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                          ESTADO_PROYECTO[asig.proyecto.estado] ?? 'bg-muted text-muted-foreground',
                        )}>
                          {asig.proyecto.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                        {fmt(asig.fechaIngreso)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                        {asig.fechaSalida ? fmt(asig.fechaSalida) : <span className="text-chart-2">Activo</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon, label, value, mono,
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
