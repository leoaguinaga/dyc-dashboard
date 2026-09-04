import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { Pago } from '@/types/api'
import { cn, formatCurrency, formatDateOnly, formatPercent } from '@/lib/utils'
import { getDestinoPago, getBeneficiario, getUrgencia } from '@/lib/pagos-utils'
import { CopyButton } from './components/CopyButton'
import { ComprobantePagoSection } from './components/ComprobantePagoSection'
import { MarcarPagadoCard } from './components/MarcarPagadoCard'

const ESTADO_LABEL: Record<Pago['estadoEfectivo'], string> = {
  borrador: 'Por completar',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Pago['estadoEfectivo'], string> = {
  borrador: 'border-border bg-muted/60 text-muted-foreground',
  pendiente: 'border-blue-200 bg-blue-50/70 text-blue-700',
  vencido: 'border-destructive/20 bg-destructive/10 text-destructive font-medium',
  pagado: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  cancelado: 'border-border bg-muted/40 text-muted-foreground',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PagoDetailPage({ params }: Props) {
  const { id } = await params
  const pago = await serverFetch<Pago>(`/pagos/${id}`).catch(() => null)
  if (!pago) notFound()

  const beneficiario = getBeneficiario(pago)
  const proyecto = pago.proyecto ?? pago.ordenCompra?.proyecto
  const destino = getDestinoPago(pago)
  const urg = getUrgencia(pago.fechaProgramada)

  // Identificador de documento origen
  const oc = pago.ordenCompra
  const ocNumRaw = oc?.numero ?? ''
  const ocNumClean = ocNumRaw.toUpperCase().startsWith('OC') || ocNumRaw.toUpperCase().startsWith('OS')
    ? ocNumRaw
    : ocNumRaw ? `OC ${ocNumRaw}` : null

  const esCompraSimple =
    oc?.destinoPago === 'trabajador' ||
    (pago.concepto && pago.concepto.toLowerCase().includes('compra simple'))

  return (
    <div className="space-y-6 w-full">
      {/* Encabezado Principal */}
      <div className="space-y-2 border-b border-border pb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            href="/pagos"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Pagos
          </Link>
          {(pago.estado === 'pagado' || pago.estado === 'cancelado') && (
            <>
              <span>/</span>
              <Link
                href="/pagos/historial"
                className="hover:text-foreground transition-colors"
              >
                Historial
              </Link>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {pago.concepto ?? oc?.concepto ?? 'Detalle del Pago'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center rounded px-2 py-0.5 text-xs border',
                  ESTADO_CLASS[pago.estadoEfectivo],
                )}
              >
                {ESTADO_LABEL[pago.estadoEfectivo]}
              </span>

              {ocNumClean && (
                <span className="inline-flex items-center rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                  {ocNumClean} {esCompraSimple ? '· Compra simple' : ''}
                </span>
              )}

              {pago.origen === 'recurrente' && (
                <span className="inline-flex items-center rounded border border-purple-200 bg-purple-50/50 px-2 py-0.5 text-xs text-purple-700">
                  Pago fijo
                </span>
              )}

              {pago.origen === 'planilla_staff' && (
                <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50/50 px-2 py-0.5 text-xs text-emerald-700">
                  Planilla
                </span>
              )}
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="block text-xs uppercase tracking-wider text-muted-foreground">
              Monto a pagar
            </span>
            <span className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(pago.monto)}
            </span>
            {pago.porcentaje && (
              <span className="block text-xs text-muted-foreground mt-0.5">
                {formatPercent(pago.porcentaje)} del total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Distribución en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: Información de la Obligación y Destino */}
        <div className="space-y-5">
          {/* Ficha 1: Información de la Obligación */}
          <div className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información de la Obligación
            </h2>

            <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
              <div>
                <span className="block text-muted-foreground">Beneficiario</span>
                <p className="font-medium text-foreground text-sm mt-0.5 truncate" title={beneficiario}>
                  {beneficiario}
                </p>
                <span className="block text-[11px] text-muted-foreground capitalize mt-0.5">
                  {pago.tipoBeneficiario}
                </span>
              </div>

              <div>
                <span className="block text-muted-foreground">Centro de costo</span>
                {proyecto ? (
                  <div className="mt-0.5">
                    <Link
                      href={`/proyectos/${proyecto.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 text-sm"
                    >
                      <span className="truncate">{proyecto.nombre ?? proyecto.codigo}</span>
                      <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                    </Link>
                    {proyecto.nombre && (
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {proyecto.codigo}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="font-medium text-foreground text-sm mt-0.5">
                    Administración / Oficina
                  </p>
                )}
              </div>

              <div>
                <span className="block text-muted-foreground">Fecha programada</span>
                <p className="font-medium text-foreground text-sm mt-0.5">
                  {formatDateOnly(pago.fechaProgramada)}
                </p>
                {pago.estadoEfectivo === 'pendiente' || pago.estadoEfectivo === 'vencido' ? (
                  <span
                    className={cn(
                      'inline-block text-[11px] mt-0.5',
                      urg.tipo === 'vencido' ? 'text-destructive font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {urg.label}
                  </span>
                ) : null}
              </div>

              <div>
                <span className="block text-muted-foreground">Monto del tramo</span>
                <p className="font-semibold text-foreground text-sm mt-0.5 tabular-nums">
                  {formatCurrency(pago.monto)}
                </p>
                {pago.porcentaje && oc?.montoTotal && (
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {formatPercent(pago.porcentaje)} de {formatCurrency(oc.montoTotal)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ficha 2: Destino Solicitado por el Beneficiario */}
          <div className="rounded-xl border border-border bg-white p-5 space-y-3.5 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Destino Solicitado
            </h2>

            {destino.esBilletera ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-semibold',
                      destino.billetera === 'yape'
                        ? 'border border-purple-200 bg-purple-50 text-purple-700'
                        : 'border border-cyan-200 bg-cyan-50 text-cyan-700',
                    )}
                  >
                    {destino.metodoLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Billetera móvil
                  </span>
                </div>

                <div className="pt-1">
                  <span className="block text-xs text-muted-foreground mb-1">
                    Número celular:
                  </span>
                  {destino.numero ? (
                    <CopyButton text={destino.numero} label={`Cel: ${destino.numero}`} />
                  ) : (
                    <span className="text-xs text-muted-foreground/70 italic">
                      Sin número registrado en el perfil.
                    </span>
                  )}
                </div>
              </div>
            ) : (destino.banco || destino.numero || destino.cci) ? (
              <div className="space-y-2.5">
                {destino.bancoNorm && destino.bancoNorm !== 'Sin banco' && (
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground">
                      {destino.bancoNorm}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Transferencia bancaria
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {destino.numero && (
                    <CopyButton
                      text={destino.numero}
                      label={`${destino.numeroLabel}: ${destino.numero}`}
                    />
                  )}
                  {destino.cci && (
                    <CopyButton text={destino.cci} label={`CCI: ${destino.cci}`} />
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic">
                Sin cuenta bancaria ni billetera digital registrada.
              </p>
            )}
          </div>

          {/* Ficha 3: Documento Fuente y Auditoría */}
          <div className="rounded-xl border border-border bg-white p-5 space-y-3.5 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documento Fuente y Auditoría
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              {oc && (
                <>
                  <div>
                    <span className="block text-muted-foreground">Documento fuente</span>
                    <Link
                      href={esCompraSimple ? `/compras-simples` : `/ordenes-compra/${oc.id}`}
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>{oc.numero}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  <div>
                    <span className="block text-muted-foreground">Total contratado</span>
                    <p className="font-medium text-foreground mt-0.5 tabular-nums">
                      {formatCurrency(oc.montoTotal)}
                    </p>
                  </div>
                </>
              )}

              <div>
                <span className="block text-muted-foreground">Registrado por</span>
                <p className="font-medium text-foreground mt-0.5">
                  {pago.registradoPor.name}
                </p>
              </div>

              {oc?.creadoPor && (
                <div>
                  <span className="block text-muted-foreground">Emitido por</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {oc.creadoPor.name}
                  </p>
                </div>
              )}
            </div>

            {pago.nota && (
              <div className="pt-2 border-t border-border">
                <span className="block text-xs text-muted-foreground mb-1">
                  Nota / Observación:
                </span>
                <p className="text-xs text-foreground bg-muted/20 p-2.5 rounded-lg border border-border">
                  {pago.nota}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Acciones de Tesorería y Sustento */}
        <div className="space-y-5">
          {/* Ficha 1: Comprobante de Pago */}
          <ComprobantePagoSection
            pagoId={pago.id}
            comprobanteUrl={pago.comprobanteUrl}
            comprobanteNombre={pago.comprobanteNombre}
          />

          {/* Ficha 2: Liquidación del Pago */}
          {pago.estado === 'pendiente' ? (
            <MarcarPagadoCard pago={pago} />
          ) : pago.estado === 'pagado' ? (
            <div className="rounded-xl border border-border bg-white p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Liquidación Registrada
                </h2>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Desembolso realizado
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
                <div>
                  <span className="block text-muted-foreground">Fecha de pago real</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {pago.fechaPagoReal ? formatDateOnly(pago.fechaPagoReal) : '—'}
                  </p>
                </div>

                <div>
                  <span className="block text-muted-foreground">Método ejecutado</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {pago.metodoPago || 'No especificado'}
                  </p>
                </div>

                <div>
                  <span className="block text-muted-foreground">N° de operación</span>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {pago.numeroOperacion || '—'}
                  </p>
                </div>

                <div>
                  <span className="block text-muted-foreground">Liquidado por</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {pago.pagadoPor?.name || '—'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white p-5 space-y-2 shadow-xs text-xs text-muted-foreground">
              <h2 className="font-semibold uppercase tracking-wider text-muted-foreground">
                Estado de la Obligación
              </h2>
              <p>Este pago fue cancelado y no requiere desembolso financiero.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
