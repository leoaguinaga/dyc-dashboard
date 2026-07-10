import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileDown, MapPin } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { OrdenCompraActions } from './components/OrdenCompraActions'
import { LugarEntregaEditor } from './components/LugarEntregaEditor'
import { FormaPagoEditor } from './components/FormaPagoEditor'
import { NombreOcEditor } from './components/NombreOcEditor'
import { ReferenciaConceptoEditor } from './components/ReferenciaConceptoEditor'
import { OcItemsTable } from './components/OcItemsTable'
import { PagoPlanCard } from './components/PagoPlanCard'
import type { EstadoOrdenCompra, OrdenCompra, Pago, TipoRequerimiento } from '@/types/api'
import { cn } from '@/lib/utils'

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recepción parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-blue-500/10 text-blue-600',
  recibida_parcial: 'bg-amber-500/10 text-amber-600',
  recibida: 'bg-chart-2/10 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil', electrico: 'Eléctrico', seguridad: 'Seguridad', administrativo: 'Administrativo',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrdenCompraDetailPage({ params }: Props) {
  const { id } = await params
  const oc = await serverFetch<OrdenCompra>(`/ordenes-compra/${id}`).catch(() => null)
  if (!oc) notFound()
  const pagos = await serverFetch<Pago[]>(`/pagos/orden/${id}`).catch(() => [])

  const requerimiento = oc.solicitud.requerimiento

  return (
    <div className="space-y-6 w-full">
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className="space-y-1">
          <Link href="/ordenes-compra" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-120">
            <ArrowLeft className="size-3.5" />
            Órdenes de compra
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{oc.numero}</h1>
            <a
              href={`/api/ordenes-compra/${oc.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              <FileDown className="size-3.5" />
              Exportar PDF
            </a>
          </div>
          <div className='flex items-center gap-1.5'><NombreOcEditor ocId={oc.id} nombre={oc.nombre} /> <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[oc.estado])}>{ESTADO_LABEL[oc.estado]}</span></div>
        </div>
        <OrdenCompraActions oc={oc} />
      </div>

      {oc.estado === 'borrador' && !oc.proveedor.ruc && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700">
          El proveedor{' '}
          <Link href={`/proveedores/${oc.proveedorId}`} className="font-medium underline underline-offset-2">
            {oc.proveedor.razonSocial}
          </Link>{' '}
          no tiene RUC registrado. Actualízalo antes de emitir esta orden.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Info panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información general</h2>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground mb-0.5">Proveedor</dt>
                <dd className="font-medium">
                  <Link href={`/proveedores/${oc.proveedorId}`} className="hover:text-primary transition-colors duration-[120ms]">
                    {oc.proveedor.razonSocial}
                  </Link>
                  {oc.proveedor.ruc && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{oc.proveedor.ruc}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Proyecto</dt>
                <dd className="font-medium">
                  <Link href={`/proyectos/${oc.proyectoId}`} className="hover:text-primary transition-colors duration-[120ms]">
                    {oc.proyecto.codigo && <span className="font-mono text-xs mr-1.5">{oc.proyecto.codigo}</span>}
                    {oc.proyecto.nombre}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Solicitud cotización</dt>
                <dd>
                  <Link href={`/cotizaciones/${oc.solicitudId}`} className="font-mono text-sm hover:text-primary transition-colors duration-[120ms]">
                    {oc.solicitud.codigo}
                  </Link>
                </dd>
              </div>
              {requerimiento && (
                <div>
                  <dt className="text-muted-foreground mb-0.5">Requerimiento</dt>
                  <dd className="flex items-center gap-1.5">
                    <Link href={`/requerimientos/${requerimiento.id}`} className="font-mono text-sm hover:text-primary transition-colors duration-[120ms]">
                      {requerimiento.codigo}
                    </Link>
                    <span className="text-xs text-muted-foreground">{TIPO_LABEL[requerimiento.tipo]}</span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground mb-0.5">Monto total</dt>
                <dd className="text-lg font-bold tabular-nums">
                  S/ {Number(oc.montoTotal).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Creado por</dt>
                <dd>{oc.creadoPor.name}</dd>
              </div>
              {oc.fechaEmision && (
                <div>
                  <dt className="text-muted-foreground mb-0.5">Fecha emisión</dt>
                  <dd>{new Date(oc.fechaEmision).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
                </div>
              )}
              {oc.fechaEntrega && (
                <div>
                  <dt className="text-muted-foreground mb-0.5">Fecha entrega esperada</dt>
                  <dd>{new Date(oc.fechaEntrega).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
                </div>
              )}
            </dl>
            <div className="sm:col-span-2 border-t border-border pt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="size-3.5 text-muted-foreground" />
                <dt className="text-xs text-muted-foreground">Lugar de entrega</dt>
              </div>
              <LugarEntregaEditor ocId={oc.id} lugarEntrega={oc.lugarEntrega} />
            </div>

            <div className="sm:col-span-2 border-t border-border pt-3">
              <dt className="text-xs text-muted-foreground mb-1">Concepto y referencia</dt>
              <ReferenciaConceptoEditor ocId={oc.id} oc={oc} />
            </div>

            <div className="sm:col-span-2 border-t border-border pt-3">
              <dt className="text-xs text-muted-foreground mb-1">Forma de pago / detracción / contacto</dt>
              <FormaPagoEditor ocId={oc.id} oc={oc} />
            </div>

            {oc.nota && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground mb-1">Notas</dt>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{oc.nota}</p>
              </div>
            )}
          </div>
        </div>
        <div className='space-y-4'>
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
