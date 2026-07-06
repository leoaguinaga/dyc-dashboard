import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Package, Users } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import { InviteProveedorForm } from './components/InviteProveedorForm'
import { CotizacionesTabs } from './components/CotizacionesTabs'
import { AdjudicacionMatrix } from './components/AdjudicacionMatrix'
import { SolicitudActions } from './components/SolicitudActions'
import type { SolicitudCotizacion, Proveedor, EstadoSolicitud, OrdenCompra } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  cotizada: 'Cotizada',
  seleccionada: 'Seleccionada',
  aprobada_solicitante: 'Aprobada (solicitante)',
  aprobada_gerencia: 'Aprobada',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoSolicitud, string> = {
  borrador: 'bg-muted text-muted-foreground',
  enviada: 'bg-blue-500/15 text-blue-600',
  cotizada: 'bg-amber-500/15 text-amber-600',
  seleccionada: 'bg-purple-500/15 text-purple-600',
  aprobada_solicitante: 'bg-chart-2/15 text-chart-2',
  aprobada_gerencia: 'bg-chart-2/15 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function SolicitudDetailPage({ params }: Props) {
  const { id } = await params

  const [solicitud, proveedores] = await Promise.all([
    serverFetch<SolicitudCotizacion>(`/solicitudes-cotizacion/${id}`).catch((e: Error) => e),
    serverFetch<Proveedor[]>('/proveedores').catch(() => [] as Proveedor[]),
  ])

  if (solicitud instanceof Error) {
    if (solicitud.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar la solicitud.</p>
  }

  const s = solicitud
  const proveedoresInvitados = s.cotizaciones.map((c) => c.proveedorId)
  const puedeInvitar = s.estado !== 'aprobada_gerencia' && s.estado !== 'cancelada'
  const puedeAprobar = s.estado === 'cotizada'
  const receivedCotizaciones = s.cotizaciones.filter((c) => c.items.length > 0)
  const mostrarMatrix = receivedCotizaciones.length > 0 &&
    ['cotizada', 'seleccionada', 'aprobada_solicitante', 'aprobada_gerencia'].includes(s.estado)
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{s.codigo}</h1>
            <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
              <Building2 className="size-3.5" />
              {s.proyecto ? (
                <Link href={`/proyectos/${s.proyecto.id}`} className="hover:text-foreground hover:underline underline-offset-2 transition-colors duration-[120ms]">
                  {s.proyecto.nombre}
                </Link>
              ) : <span>—</span>}
              {s.proyecto?.codigo && <span className="font-mono text-xs">({s.proyecto.codigo})</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{fmt(s.creadoEn)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[s.estado])}>
              {ESTADO_LABEL[s.estado]}
            </span>
            <SolicitudActions solicitud={{ id: s.id, estado: s.estado }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ítems solicitados */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 h-fit ">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Materiales ({s.items.length})
            </h2>
          </div>

          {s.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ítems registrados</p>
          ) : (
            <div className="space-y-3">
              {s.items.map((item) => {
                const total = parseFloat(item.cantidadTotal)
                const almacen = parseFloat(item.cantidadAlmacen)
                const compra = parseFloat(item.cantidadCompra)
                return (
                  <div key={item.id} className="space-y-1">
                    <p className="text-sm font-medium">{item.descripcion}</p>
                    {item.item?.codigo && (
                      <p className="text-xs text-muted-foreground font-mono">{item.item.codigo}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">Total: <strong className="text-foreground">{total} {item.unidad}</strong></span>
                      {almacen > 0 && (
                        <span className="tabular-nums text-chart-2">Almacén: {almacen}</span>
                      )}
                      <span className="tabular-nums">Comprar: <strong>{compra} {item.unidad}</strong></span>
                    </div>
                    {/* Barra visual */}
                    {total > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-chart-2"
                          style={{ width: `${Math.min((almacen / total) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {s.nota && (
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground italic">&ldquo;{s.nota}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Cotizaciones */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
            />
          )}
        </div>
      </div>

      {/* Matriz de adjudicación */}
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
