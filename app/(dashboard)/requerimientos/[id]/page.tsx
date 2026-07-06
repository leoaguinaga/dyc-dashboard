import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertTriangle, CalendarDays, User, Building2 } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import { RequerimientoActions } from './components/RequerimientoActions'
import { RequerimientoItemsCard } from './components/RequerimientoItemsCard'
import type { Requerimiento, TipoRequerimiento } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const ESTADO_LABEL = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  observado: 'Observado',
} as const

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil:          'Civil',
  electrico:      'Eléctrico',
  seguridad:      'Seguridad',
  administrativo: 'Administrativo',
}

const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil:          'bg-blue-500/10 text-blue-600',
  electrico:      'bg-amber-500/10 text-amber-600',
  seguridad:      'bg-orange-500/10 text-orange-600',
  administrativo: 'bg-purple-500/10 text-purple-600',
}

const ESTADO_CLASS = {
  borrador: 'bg-muted text-muted-foreground',
  enviado: 'bg-blue-500/15 text-blue-600',
  aprobado: 'bg-chart-2/15 text-chart-2',
  observado: 'bg-amber-500/15 text-amber-600',
} as const

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function RequerimientoDetailPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<Requerimiento>(`/requerimientos/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el requerimiento.</p>
  }

  const r = result

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/requerimientos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a requerimientos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {r.urgente && (
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <AlertTriangle className="size-5" />
              </div>
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{r.nombre}</h1>
                <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.proyecto.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TIPO_CLASS[r.tipo])}>
              {TIPO_LABEL[r.tipo]}
            </span>
            {r.urgente && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                <AlertTriangle className="size-3" />
                Urgente
              </span>
            )}
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[r.estado])}>
              {ESTADO_LABEL[r.estado]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Info + acciones */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Proyecto</dt>
                  <dd className="font-medium">{r.proyecto.nombre}</dd>
                  {r.proyecto.codigo && <dd className="text-xs text-muted-foreground font-mono">{r.proyecto.codigo}</dd>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Solicitante</dt>
                  <dd className="font-medium">{r.creadoPor.name}</dd>
                  <dd className="text-xs text-muted-foreground">{r.creadoPor.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Creado</dt>
                  <dd className="font-medium">{fmt(r.creadoEn)}</dd>
                </div>
              </div>
              {r.fechaEntregaRequerida && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="size-4 mt-0.5 text-amber-500 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Entrega requerida</dt>
                    <dd className="font-medium text-amber-600">
                      {new Date(r.fechaEntregaRequerida).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </dd>
                  </div>
                </div>
              )}
              {r.nota && (
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Nota</p>
                  <p className="text-sm">{r.nota}</p>
                </div>
              )}
              {r.notaRevision && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2">
                  <p className="text-xs text-amber-600 mb-0.5">Observación</p>
                  <p className="text-sm">{r.notaRevision}</p>
                </div>
              )}
            </dl>
          </div>

          {/* Acciones */}
          <RequerimientoActions requerimiento={r} />

          {/* Historial */}
          {r.historial && r.historial.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5 space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Historial</h2>
              <ol className="space-y-2.5">
                {r.historial.map((h) => (
                  <li key={h.id} className="flex items-start gap-2 text-sm">
                    <span className={cn('mt-0.5 inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[h.estado])}>
                      {ESTADO_LABEL[h.estado]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {fmt(h.creadoEn)}
                        {h.actor && <> · {h.actor.name}{h.actorRole && ` (${h.actorRole})`}</>}
                      </p>
                      {h.nota && <p className="mt-0.5 text-sm">{h.nota}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Solicitudes vinculadas */}
          {r.solicitudes && r.solicitudes.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5 space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitudes de cotización</h2>
              <div className="space-y-2">
                {r.solicitudes.map((s) => (
                  <Link
                    key={s.id}
                    href={`/cotizaciones/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition-colors duration-[120ms]"
                  >
                    <span className="font-mono text-xs font-medium">{s.codigo}</span>
                    <span className="text-xs text-muted-foreground">{s.estado}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ítems */}
        <div className="lg:col-span-2">
          <RequerimientoItemsCard requerimiento={r} />
        </div>
      </div>
    </div>
  )
}
