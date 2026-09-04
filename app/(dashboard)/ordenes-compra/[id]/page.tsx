import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileDown, FileText, MapPin } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { OrdenCompraActions } from './components/OrdenCompraActions'
import { LugarEntregaEditor } from './components/LugarEntregaEditor'
import { FormaPagoEditor } from './components/FormaPagoEditor'
import { NombreOcEditor } from './components/NombreOcEditor'
import { NumeroTipoEditor } from './components/NumeroTipoEditor'
import { ReferenciaConceptoEditor } from './components/ReferenciaConceptoEditor'
import { OcItemsTable } from './components/OcItemsTable'
import { PagoPlanCard } from './components/PagoPlanCard'
import type { EstadoOrdenCompra, OrdenCompra, Pago, TipoRequerimiento } from '@/types/api'
import { cn, formatCurrency } from '@/lib/utils'

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recepción parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-blue-500/10 text-blue-700',
  recibida_parcial: 'bg-amber-500/10 text-amber-700',
  recibida: 'bg-chart-2/10 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Administrativo',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrdenCompraDetailPage({ params }: Props) {
  const { id } = await params
  const oc = await serverFetch<OrdenCompra>(`/ordenes-compra/${id}`).catch(() => null)
  if (!oc) notFound()
  const pagos = await serverFetch<Pago[]>(`/pagos/orden/${id}`).catch(() => [])

  const requerimiento = oc.solicitud?.requerimiento

  return (
    <div className="space-y-5 w-full">
      {/* Cabecera y Navegación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="space-y-1">
          <Link
            href="/ordenes"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Órdenes C/S
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <NumeroTipoEditor ocId={oc.id} numero={oc.numero} tipo={oc.tipo} />
            <a
              href={`/api/ordenes-compra/${oc.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              <FileDown className="size-3.5" />
              Exportar PDF
            </a>
            <a
              href={`/api/ordenes-compra/${oc.id}/word`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60 shadow-2xs"
            >
              <FileText className="size-3.5 text-primary" />
              Exportar Word
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <NombreOcEditor ocId={oc.id} nombre={oc.nombre} />
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                ESTADO_CLASS[oc.estado]
              )}
            >
              {ESTADO_LABEL[oc.estado]}
            </span>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="self-start md:self-center">
          <OrdenCompraActions oc={oc} />
        </div>
      </div>

      {/* Alerta de RUC si está en borrador */}
      {oc.estado === 'borrador' && oc.proveedor && !oc.proveedor.ruc && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5 text-sm text-amber-700">
          El proveedor{' '}
          <Link href={`/proveedores/${oc.proveedorId}`} className="font-medium underline underline-offset-2">
            {oc.proveedor.razonSocial}
          </Link>{' '}
          no tiene RUC registrado. Actualízalo antes de emitir esta orden.
        </div>
      )}

      {/* Estructura en 2 Columnas de v1 */}
      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {/* Columna Izquierda: Información General y Editores Directos */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-2xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información general
            </h2>

            <dl className="grid gap-3.5 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Proveedor</dt>
                <dd className="font-medium text-foreground">
                  {oc.proveedor ? (
                    <Link
                      href={`/proveedores/${oc.proveedorId}`}
                      className="hover:text-primary transition-colors"
                    >
                      {oc.proveedor.razonSocial}
                    </Link>
                  ) : (
                    <span>{oc.proveedorNombreLibre ?? '—'}</span>
                  )}
                  {oc.proveedor?.ruc && (
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                      {oc.proveedor.ruc}
                    </span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Proyecto</dt>
                <dd className="font-medium text-foreground">
                  <Link
                    href={`/proyectos/${oc.proyectoId}`}
                    className="hover:text-primary transition-colors"
                  >
                    {oc.proyecto.codigo && (
                      <span className="font-mono text-xs mr-1 text-muted-foreground">
                        [{oc.proyecto.codigo}]
                      </span>
                    )}
                    <span>{oc.proyecto.nombre}</span>
                  </Link>
                </dd>
              </div>

              {oc.solicitud && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Solicitud cotización</dt>
                  <dd>
                    <Link
                      href={`/cotizaciones/${oc.solicitudId}`}
                      className="font-mono text-sm hover:text-primary transition-colors"
                    >
                      {oc.solicitud.codigo}
                    </Link>
                  </dd>
                </div>
              )}

              {requerimiento && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Requerimiento</dt>
                  <dd className="flex items-center gap-1.5">
                    <Link
                      href={`/requerimientos/${requerimiento.id}`}
                      className="font-mono text-sm hover:text-primary transition-colors"
                    >
                      {requerimiento.codigo}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {TIPO_LABEL[requerimiento.tipo]}
                    </span>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Monto total</dt>
                <dd className="text-lg font-bold tabular-nums text-foreground">
                  {formatCurrency(oc.montoTotal)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Creado por</dt>
                <dd className="text-foreground">{oc.creadoPor.name}</dd>
              </div>

              {oc.fechaEmision && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Fecha emisión</dt>
                  <dd className="text-foreground">
                    {new Date(oc.fechaEmision).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}

              {oc.fechaEntrega && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Fecha entrega esperada</dt>
                  <dd className="text-foreground">
                    {new Date(oc.fechaEntrega).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>

            {/* Lugar de entrega */}
            <div className="border-t border-border pt-3.5">
              <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                <MapPin className="size-3.5" />
                <dt className="text-xs">Lugar de entrega</dt>
              </div>
              <LugarEntregaEditor ocId={oc.id} lugarEntrega={oc.lugarEntrega} />
            </div>

            {/* Concepto y referencia */}
            <div className="border-t border-border pt-3.5">
              <dt className="text-xs text-muted-foreground mb-1">Concepto y referencia</dt>
              <ReferenciaConceptoEditor ocId={oc.id} oc={oc} />
            </div>

            {/* Forma de pago / detracción / contacto */}
            <div className="border-t border-border pt-3.5">
              <dt className="text-xs text-muted-foreground mb-1">
                Forma de pago / detracción / contacto
              </dt>
              <FormaPagoEditor ocId={oc.id} oc={oc} />
            </div>

            {oc.nota && (
              <div className="border-t border-border pt-3.5">
                <dt className="text-xs text-muted-foreground mb-1">Notas</dt>
                <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                  {oc.nota}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Ítems y Plan de Pagos */}
        <div className="space-y-4">
          <OcItemsTable
            ocId={oc.id}
            items={oc.items}
            montoTotal={oc.montoTotal}
            editable={oc.estado === 'borrador' || oc.estado === 'emitida'}
          />

          {/* Plan de pagos */}
          <PagoPlanCard oc={oc} pagos={pagos} />
        </div>
      </div>
    </div>
  )
}
