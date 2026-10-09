import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, FileDown, FileSpreadsheet } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { OrdenCompraActions } from './components/OrdenCompraActions'
import { LugarEntregaEditor } from './components/LugarEntregaEditor'
import { FormaPagoEditor } from './components/FormaPagoEditor'
import { NombreOcEditor } from './components/NombreOcEditor'
import { NumeroTipoEditor } from './components/NumeroTipoEditor'
import { ReferenciaConceptoEditor } from './components/ReferenciaConceptoEditor'
import { OcItemsTable } from './components/OcItemsTable'
import { PagoPlanCard } from './components/PagoPlanCard'
import { EstadoProgreso } from './components/EstadoProgreso'
import type { EstadoOrdenCompra, OrdenCompra, TipoRequerimiento } from '@/types/api'
import { cn, formatCurrency } from '@/lib/utils'
import { ocTotalConIgv } from '@/lib/ordenes'

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recepción parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-info-soft text-info',
  recibida_parcial: 'bg-warning-soft text-warning',
  recibida: 'bg-success-soft text-success',
  cancelada: 'bg-danger-soft text-danger',
}

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Administrativo',
}

const EXPORT_LINK =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrdenCompraDetailPage({ params }: Props) {
  const { id } = await params
  // Sólo un 400/403/404 significa "esta orden no existe o no es tuya"; un fallo del
  // servidor debe verse como error, no disfrazarse de 404.
  const oc = await serverFetch<OrdenCompra>(`/ordenes-compra/${id}`).catch((e: unknown) => {
    if (e instanceof Error && /^API (400|403|404):/.test(e.message)) return null
    throw e
  })
  if (!oc) notFound()
  const pagos = oc.pagos ?? []
  const pagadoPct = pagos.filter((p) => p.estado === 'pagado').reduce((sum, p) => sum + Number(p.porcentaje), 0)
  const cuotasPendientes = pagos.filter((p) => p.estado === 'pendiente' || p.estado === 'borrador').length
  const entregaAntesDeEmision =
    !!oc.fechaEmision && !!oc.fechaEntrega && oc.fechaEntrega.slice(0, 10) < oc.fechaEmision.slice(0, 10)

  const requerimiento = oc.solicitud?.requerimiento

  return (
    <div className="space-y-5 w-full">
      {/* Cabecera y Navegación */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={oc.compraSimpleId ? `/compras-simples/${oc.compraSimpleId}` : '/ordenes'}
            className="inline-flex items-center gap-1.5 rounded text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {oc.compraSimpleId ? 'Volver a la compra simple' : 'Órdenes C/S'}
          </Link>
          <NombreOcEditor ocId={oc.id} nombre={oc.nombre} />
          <div className="flex items-center gap-2 flex-wrap">
            <NumeroTipoEditor ocId={oc.id} numero={oc.numero} tipo={oc.tipo} />
            <EstadoProgreso estado={oc.estado} />
          </div>
        </div>

        {/* Exportaciones y acciones principales */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <a href={`/api/ordenes-compra/${oc.id}/pdf`} target="_blank" rel="noopener noreferrer" className={EXPORT_LINK}>
            <FileDown className="size-3.5" aria-hidden="true" />
            Exportar PDF
          </a>
          <a href={`/api/ordenes-compra/${oc.id}/excel`} download className={EXPORT_LINK}>
            <FileSpreadsheet className="size-3.5" aria-hidden="true" />
            Exportar Excel
          </a>
          <OrdenCompraActions oc={oc} />
        </div>
      </div>

      {/* Alerta de RUC si está en borrador */}
      {oc.estado === 'borrador' && oc.proveedor && !oc.proveedor.ruc && (
        <div className="rounded-lg border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
          El proveedor{' '}
          <Link href={`/proveedores/${oc.proveedorId}`} className="font-medium underline underline-offset-2">
            {oc.proveedor.razonSocial}
          </Link>{' '}
          no tiene RUC registrado. Actualízalo antes de emitir esta orden.
        </div>
      )}

      {/* Estructura en 2 Columnas de v1 */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        {/* Columna Izquierda: Información General y Editores Directos */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información general
            </h2>

            <div className="rounded-lg bg-muted/40 px-3.5 py-3 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p>
                  <span className="sr-only">Monto total: </span>
                  <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(ocTotalConIgv(oc))}</span>
                </p>
                {oc.estado !== 'cancelada' && (
                  <p className="text-xs text-muted-foreground">
                    {pagos.length === 0
                      ? 'Sin cuotas programadas'
                      : `Pagado ${pagadoPct.toLocaleString('es-PE', { maximumFractionDigits: 2 })}% · ${cuotasPendientes} ${cuotasPendientes === 1 ? 'cuota pendiente' : 'cuotas pendientes'}`}
                  </p>
                )}
              </div>
              {oc.estado !== 'cancelada' && pagos.length > 0 && (
                <div
                  role="progressbar"
                  aria-label="Avance de pago"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.round(pagadoPct))}
                  className="h-1.5 overflow-hidden rounded-full bg-border"
                >
                  <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, pagadoPct)}%` }} />
                </div>
              )}
            </div>

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
                    {entregaAntesDeEmision && (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        Anterior a la fecha de emisión
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {/* Lugar de entrega */}
            <div className="border-t border-border pt-3">
              <LugarEntregaEditor ocId={oc.id} lugarEntrega={oc.lugarEntrega} />
            </div>

            {/* Concepto y referencia */}
            <div className="border-t border-border pt-3">
              <ReferenciaConceptoEditor ocId={oc.id} oc={oc} />
            </div>

            {/* Forma de pago / detracción / contacto */}
            <div className="border-t border-border pt-3">
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
            incluyeIgv={oc.incluyeIgv}
            editable={oc.estado === 'borrador' || oc.estado === 'emitida'}
          />

          {/* Plan de pagos */}
          <PagoPlanCard oc={oc} pagos={pagos} editable={oc.estado !== 'cancelada'} />
        </div>
      </div>
    </div>
  )
}
