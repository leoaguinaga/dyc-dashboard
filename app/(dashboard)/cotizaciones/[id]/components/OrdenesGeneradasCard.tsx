import Link from 'next/link'
import { ArrowRight, ExternalLink, FileDown, ShoppingCart, Calendar, CreditCard, User } from 'lucide-react'
import { cn, formatCurrency, formatDateOnly } from '@/lib/utils'
import { ordenBasePath, ordenLabel } from '@/lib/ordenes'
import type { SolicitudOrdenCompra, EstadoOrdenCompra } from '@/types/api'

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recepción parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-blue-500/15 text-blue-600',
  recibida_parcial: 'bg-amber-500/15 text-amber-600',
  recibida: 'bg-chart-2/15 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

interface Props {
  ordenes: SolicitudOrdenCompra[]
}

export function OrdenesGeneradasCard({ ordenes }: Props) {
  if (!ordenes || ordenes.length === 0) return null

  const totalGeneral = ordenes.reduce((acc, o) => acc + (Number(o.montoTotal) || 0), 0)

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 col-span-full">
      {/* Encabezado de la sección */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2">
            <ShoppingCart className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {ordenes.length === 1
                ? 'Orden de compra/servicio generada'
                : `Órdenes generadas (${ordenes.length})`}
            </h2>
            <p className="text-xs text-muted-foreground">
              Documentos generados a partir de la adjudicación de esta cotización
            </p>
          </div>
        </div>

        {ordenes.length > 1 && (
          <div className="flex items-baseline gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
            <span>Total adjudicado ({ordenes.length} órdenes):</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {formatCurrency(totalGeneral)}
            </span>
          </div>
        )}
      </div>

      {/* Lista de órdenes */}
      <div className="space-y-4">
        {ordenes.map((orden) => {
          const basePath = ordenBasePath(orden.tipo)
          const ordenUrl = `${basePath}/${orden.id}`
          const proveedorNombre = orden.proveedor?.razonSocial ?? orden.proveedorNombreLibre ?? 'Proveedor sin asignar'

          return (
            <div
              key={orden.id}
              className="rounded-lg border border-border bg-white overflow-hidden shadow-xs hover:border-border/80 transition-colors"
            >
              {/* Header de la orden individual */}
              <div className="p-4 bg-muted/20 border-b border-border/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    href={ordenUrl}
                    className="font-mono font-bold text-base text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span>{orden.numero}</span>
                    <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>

                  <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-secondary text-secondary-foreground border border-border/40">
                    {ordenLabel(orden.tipo)}
                  </span>

                  <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-medium', ESTADO_CLASS[orden.estado])}>
                    {ESTADO_LABEL[orden.estado]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block text-[11px]">Total orden</span>
                    <div className="text-base font-bold font-mono text-foreground leading-tight">
                      {formatCurrency(orden.montoTotal)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {orden.incluyeIgv ? 'Incluye IGV' : '+ IGV'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-1">
                    <a
                      href={`/api/ordenes-compra/${orden.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Descargar o imprimir PDF de la orden"
                    >
                      <FileDown className="size-3.5" />
                      <span className="hidden sm:inline">PDF</span>
                    </a>

                    <Link
                      href={ordenUrl}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <span>Ver orden</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Fila de metadatos de la orden */}
              <div className="px-4 py-2.5 bg-muted/5 border-b border-border/40 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Proveedor</span>
                  {orden.proveedor ? (
                    <Link
                      href={`/proveedores/${orden.proveedor.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {proveedorNombre}
                      {orden.proveedor.ruc && (
                        <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                          · {orden.proveedor.ruc}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{proveedorNombre}</span>
                  )}
                </div>

                {orden.condicionPago && (
                  <div className="flex items-start gap-1.5">
                    <CreditCard className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-0.5">Condición de pago</span>
                      <span className="font-medium text-foreground">{orden.condicionPago}</span>
                    </div>
                  </div>
                )}

                {orden.fechaEntrega && (
                  <div className="flex items-start gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-0.5">Fecha de entrega</span>
                      <span className="font-medium text-foreground">{formatDateOnly(orden.fechaEntrega)}</span>
                    </div>
                  </div>
                )}

                {orden.creadoPor && (
                  <div className="flex items-start gap-1.5">
                    <User className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-0.5">Generada por</span>
                      <span className="font-medium text-foreground">{orden.creadoPor.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla detallada de qué se compró y a qué precio */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-medium">
                      <th className="text-left py-2 px-4">Descripción del ítem</th>
                      <th className="text-right py-2 px-3">Cantidad</th>
                      <th className="text-right py-2 px-3">Precio unitario</th>
                      <th className="text-right py-2 px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {orden.items && orden.items.length > 0 ? (
                      orden.items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-4 align-top">
                            <p className="font-medium text-foreground">{item.descripcion}</p>
                            {item.codigo && (
                              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                Código: {item.codigo}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground align-top whitespace-nowrap">
                            <span className="text-foreground font-medium">{parseFloat(item.cantidad)}</span>{' '}
                            <span>{item.unidad}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground align-top whitespace-nowrap">
                            {formatCurrency(item.precioUnitario)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-medium text-foreground align-top whitespace-nowrap">
                            {formatCurrency(item.precioTotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">
                          No hay ítems registrados en esta orden
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {orden.items && orden.items.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border/60 bg-muted/20 font-medium">
                        <td colSpan={3} className="py-2 px-4 text-right text-muted-foreground">
                          Subtotal {orden.numero}:
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(orden.montoTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
