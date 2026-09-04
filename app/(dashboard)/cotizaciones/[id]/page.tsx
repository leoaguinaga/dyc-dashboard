import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, FileText, Users } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import { InviteProveedorForm } from './components/InviteProveedorForm'
import { CotizacionesTabs } from './components/CotizacionesTabs'
import { AdjudicacionMatrix } from './components/AdjudicacionMatrix'
import { SolicitudActions } from './components/SolicitudActions'
import { MaterialesSolicitadosCard } from './components/MaterialesSolicitadosCard'
import { OrdenesGeneradasCard } from './components/OrdenesGeneradasCard'
import type { SolicitudCotizacion, Proveedor, EstadoSolicitud, OrdenCompra, User } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

// Debe coincidir con @Roles del endpoint PATCH .../cotizaciones/:id/aprobar
const CON_ACCESO_APROBAR_COTIZACION = ['administrador', 'admin_ti', 'gerencia']

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  cotizada: 'Cotizada',
  seleccionada: 'Adjudicada',
  aprobada_solicitante: 'Esperando gerencia',
  aprobada_gerencia: 'Aprobada',
  orden_generada: 'Orden generada',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoSolicitud, string> = {
  borrador: 'bg-muted text-muted-foreground',
  enviada: 'bg-blue-500/15 text-blue-600',
  cotizada: 'bg-amber-500/15 text-amber-600',
  seleccionada: 'bg-purple-500/15 text-purple-600',
  aprobada_solicitante: 'bg-orange-500/15 text-orange-600',
  aprobada_gerencia: 'bg-chart-2/15 text-chart-2',
  orden_generada: 'bg-slate-500/15 text-slate-600',
  cancelada: 'bg-destructive/10 text-destructive',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function SolicitudDetailPage({ params }: Props) {
  const { id } = await params

  const [solicitud, proveedores, user] = await Promise.all([
    serverFetch<SolicitudCotizacion>(`/solicitudes-cotizacion/${id}`).catch((e: Error) => e),
    serverFetch<Proveedor[]>('/proveedores').catch(() => [] as Proveedor[]),
    serverFetch<User>('/users/me').catch(() => null),
  ])

  if (solicitud instanceof Error) {
    if (solicitud.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar la solicitud.</p>
  }

  const s = solicitud
  const proveedoresInvitados = s.cotizaciones.map((c) => c.proveedorId)
  const puedeInvitar = s.estado !== 'aprobada_gerencia' && s.estado !== 'orden_generada' && s.estado !== 'cancelada'
  const puedeAprobar = s.estado === 'cotizada' &&
    !!user?.role && CON_ACCESO_APROBAR_COTIZACION.includes(user.role)
  const receivedCotizaciones = s.cotizaciones.filter((c) => c.items.length > 0)
  const mostrarMatrix = receivedCotizaciones.length > 0 &&
    ['cotizada', 'seleccionada', 'aprobada_solicitante', 'aprobada_gerencia', 'orden_generada'].includes(s.estado)
  const ordenesExistentes = (s.ordenes ?? []) as Pick<OrdenCompra, 'id' | 'numero'>[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/cotizaciones"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a cotizaciones
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{s.codigo}</h1>
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[s.estado])}>
              {ESTADO_LABEL[s.estado]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SolicitudActions solicitud={{ id: s.id, estado: s.estado }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Columna izquierda: Información general + Materiales solicitados */}
        <div className="space-y-4 h-fit">
          {/* Card de información */}
          <div className="rounded-xl border border-border bg-white p-5 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Información general
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground mb-0.5">Proyecto</dt>
                  <dd>
                    {s.proyecto ? (
                      <Link
                        href={`/proyectos/${s.proyecto.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors duration-[120ms] inline-flex items-center gap-1.5 flex-wrap"
                      >
                        <span>{s.proyecto.nombre}</span>
                        {s.proyecto.codigo && (
                          <span className="font-mono text-xs text-muted-foreground font-normal">
                            ({s.proyecto.codigo})
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FileText className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground mb-0.5">Requerimiento</dt>
                  <dd>
                    {s.requerimiento ? (
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <Link
                          href={`/requerimientos/${s.requerimiento.id}`}
                          className="font-mono font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors duration-[120ms]"
                        >
                          {s.requerimiento.codigo}
                        </Link>
                        {s.requerimiento.nombre && (
                          <span className="text-muted-foreground">
                            · {s.requerimiento.nombre}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CalendarDays className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground mb-0.5">Fecha de solicitud</dt>
                  <dd className="font-medium text-foreground">{fmt(s.creadoEn)}</dd>
                </div>
              </div>
            </dl>

            {(s.aprobadaSolicitantePor || s.aprobadaGerenciaPor) && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Aprobaciones
                </p>
                {s.aprobadaSolicitantePor && (
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="size-3.5 mt-0.5 text-chart-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground">
                        Aprobado como solicitante:{' '}
                        <strong className="text-foreground font-medium">
                          {s.aprobadaSolicitantePor.name}
                        </strong>
                        {s.aprobadaSolicitantePorRole && (
                          <span> ({s.aprobadaSolicitantePorRole})</span>
                        )}
                      </p>
                      {s.aprobadaSolicitanteEn && (
                        <p className="text-muted-foreground mt-0.5">
                          {fmt(s.aprobadaSolicitanteEn)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {s.aprobadaGerenciaPor && (
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="size-3.5 mt-0.5 text-chart-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground">
                        Aprobado por gerencia:{' '}
                        <strong className="text-foreground font-medium">
                          {s.aprobadaGerenciaPor.name}
                        </strong>
                        {s.aprobadaGerenciaPorRole && (
                          <span> ({s.aprobadaGerenciaPorRole})</span>
                        )}
                      </p>
                      {s.aprobadaGerenciaEn && (
                        <p className="text-muted-foreground mt-0.5">
                          {fmt(s.aprobadaGerenciaEn)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ítems solicitados */}
          <MaterialesSolicitadosCard
            solicitudId={s.id}
            estado={s.estado}
            items={s.items}
            nota={s.nota}
            role={user?.role}
          />
        </div>

        {/* Cotizaciones */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 h-fit lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Cotizaciones ({s.cotizaciones.length})
              </h2>
            </div>
            {puedeInvitar && (
              <InviteProveedorForm
                solicitudId={s.id}
                proveedores={proveedores}
                proveedoresYaInvitados={proveedoresInvitados}
              />
            )}
          </div>

          {s.cotizaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                Aún no hay proveedores invitados a cotizar
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Usa &ldquo;Invitar proveedor&rdquo; para comenzar
              </p>
            </div>
          ) : (
            <CotizacionesTabs
              cotizaciones={s.cotizaciones}
              solicitudItems={s.items}
              canApprove={puedeAprobar}
              solicitudEstado={s.estado}
              role={user?.role}
            />
          )}
        </div>
      </div>

      {/* Órdenes generadas */}
      {s.ordenes && s.ordenes.length > 0 && (
        <OrdenesGeneradasCard ordenes={s.ordenes} />
      )}

      {/* Matriz de adjudicación (Cuadro comparativo) */}
      {mostrarMatrix && (
        <AdjudicacionMatrix
          solicitudId={s.id}
          solicitudItems={s.items}
          cotizaciones={s.cotizaciones}
          estado={s.estado}
          ordenesExistentes={ordenesExistentes}
        />
      )}
    </div>
  )
}
