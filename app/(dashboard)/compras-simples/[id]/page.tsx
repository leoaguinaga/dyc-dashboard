import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Building2, CalendarDays, AlertTriangle, ShieldCheck } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import { GrupoAprobacionActions } from './components/GrupoAprobacionActions'
import { GrupoFacturaSection } from './components/GrupoFacturaSection'
import { GrupoEditarItemsForm } from './components/GrupoEditarItemsForm'
import type { CompraSimple, EstadoAprobacionCompra, TipoRequerimiento } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const ESTADO_LABEL: Record<EstadoAprobacionCompra, string> = {
  pendiente: 'Pendiente de aprobación técnica',
  aprobada_tecnico: 'Aprobado por área técnica · falta gerencia',
  aprobada: 'Aprobada',
  observada: 'Observada',
}

const ESTADO_CLASS: Record<EstadoAprobacionCompra, string> = {
  pendiente: 'bg-blue-500/15 text-blue-600',
  aprobada_tecnico: 'bg-indigo-500/15 text-indigo-600',
  aprobada: 'bg-chart-2/15 text-chart-2',
  observada: 'bg-amber-500/15 text-amber-600',
}

const METODO_TRABAJADOR_LABEL: Record<string, string> = {
  registrado: 'Banco/cuenta registrados del trabajador',
  transferencia: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
}

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Administrativo',
}

const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: 'bg-blue-500/10 text-blue-600',
  electrico: 'bg-amber-500/10 text-amber-600',
  seguridad: 'bg-orange-500/10 text-orange-600',
  administrativo: 'bg-purple-500/10 text-purple-600',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtMoney(v: string) {
  return `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function CompraSimpleDetailPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<CompraSimple>(`/compras-simples/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar la compra simple.</p>
  }

  const c = result
  const total = c.grupos.reduce((s, g) => s + Number(g.montoTotal), 0)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/compras-simples"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a compras simples
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              {c.esRendicion && (
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <AlertTriangle className="size-5" />
                </div>
              )}
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{c.nombre}</h1>
                  <span className="font-mono text-xs text-muted-foreground">{c.codigo}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.proyecto.nombre}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TIPO_CLASS[c.tipo])}>
              {TIPO_LABEL[c.tipo]}
            </span>
            {c.esRendicion && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                <AlertTriangle className="size-3" />
                Rendición
              </span>
            )}
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{fmtMoney(String(total))}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Proyecto</dt>
                  <dd className="font-medium">{c.proyecto.nombre}</dd>
                  {c.proyecto.codigo && <dd className="text-xs text-muted-foreground font-mono">{c.proyecto.codigo}</dd>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Solicitante</dt>
                  <dd className="font-medium">{c.creadoPor.name}</dd>
                  <dd className="text-xs text-muted-foreground">{c.creadoPor.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Creado</dt>
                  <dd className="font-medium">{fmt(c.creadoEn)}</dd>
                </div>
              </div>
              {c.esRendicion && c.aprobadoInformalPor && (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Aprobó la compra (respaldo)</dt>
                    <dd className="font-medium">{c.aprobadoInformalPor.name}</dd>
                  </div>
                </div>
              )}
              {c.nota && (
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Nota</p>
                  <p className="text-sm">{c.nota}</p>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {c.grupos.map((g) => (
            <div key={g.id} className="rounded-xl border border-border bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{g.numero}</p>
                  <p className="font-medium">{g.proveedor?.razonSocial ?? g.proveedorNombreLibre}</p>
                  {!g.proveedor && (
                    <p className="text-xs text-amber-600">Sin proveedor registrado</p>
                  )}
                  {g.fechaEntrega && (
                    <p className="text-xs text-muted-foreground">Fecha solicitada: {fmt(g.fechaEntrega)}</p>
                  )}
                </div>
                {g.estadoAprobacion && (
                  <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[g.estadoAprobacion])}>
                    {ESTADO_LABEL[g.estadoAprobacion]}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Descripción</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Cant.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">P. Unit.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {g.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2">{it.descripcion}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{Number(it.cantidad)} {it.unidad}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(it.precioUnitario)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtMoney(it.precioTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">
                  Total grupo: <span className="font-medium">{fmtMoney(g.montoTotal)}</span>
                </p>
              </div>

              {g.destinoPago && (
                <div className="rounded-lg bg-muted/40 px-3 py-2 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Condiciones de pago</p>
                  {g.destinoPago === 'empresa' ? (
                    <p className="text-sm">
                      Depósito a la empresa · {g.pagoBanco} · Cta. {g.pagoNumeroCuenta} · {g.pagoRazonSocial}
                    </p>
                  ) : (
                    <p className="text-sm">
                      Depósito al solicitante{g.pagoTrabajador ? ` (${g.pagoTrabajador.nombre})` : ''} · {g.pagoMetodo && METODO_TRABAJADOR_LABEL[g.pagoMetodo]}
                      {g.pagoMetodo === 'transferencia' && ` · ${g.pagoTrabajadorBanco} · Cta. ${g.pagoTrabajadorNumeroCuenta}`}
                      {(g.pagoMetodo === 'yape' || g.pagoMetodo === 'plin') && ` · ${g.pagoTrabajadorNumero}`}
                    </p>
                  )}
                </div>
              )}

              {g.notaAprobacion && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2">
                  <p className="text-xs text-amber-600 mb-0.5">Observación</p>
                  <p className="text-sm">{g.notaAprobacion}</p>
                </div>
              )}

              <GrupoEditarItemsForm grupo={g} tipo={c.tipo} esRendicion={c.esRendicion} />

              <GrupoAprobacionActions grupo={g} creadoPorId={c.creadoPorId} tipo={c.tipo} />

              <GrupoFacturaSection
                grupoId={g.id}
                archivos={g.archivos ?? []}
                estadoAprobacion={g.estadoAprobacion}
                creadoPorId={c.creadoPorId}
                esRendicion={c.esRendicion}
              />

              {g.historial && g.historial.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Historial de aprobación</h3>
                  <ol className="space-y-2">
                    {g.historial.map((h) => (
                      <li key={h.id} className="flex items-start gap-2 text-sm">
                        <span className={cn('mt-0.5 inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[h.estado])}>
                          {ESTADO_LABEL[h.estado]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {fmtDateTime(h.creadoEn)}
                            {h.actor && <> · {h.actor.name}{h.actorRole && ` (${h.actorRole})`}</>}
                          </p>
                          {h.nota && <p className="mt-0.5 text-sm">{h.nota}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
