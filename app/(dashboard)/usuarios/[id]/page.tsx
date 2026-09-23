import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Briefcase,
  Activity,
  FileText,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  Receipt,
  Clock,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImpersonateButtonHeader } from './editar/components/ImpersonateButtonHeader'
import { AuditLogSection } from './components/AuditLogSection'
import { ROLE_LABELS } from '@/lib/roles'
import type { AuditLogPage, UserActivity, UserActivityCounts, UserActivityItem } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function dayKey(iso: string) {
  return new Date(iso).toDateString()
}

function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(iso) === dayKey(today.toISOString())) return 'Hoy'
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Ayer'
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

const TIPO_META: Record<UserActivityItem['tipo'], { icon: LucideIcon; color: string }> = {
  requerimiento: { icon: FileText, color: 'bg-chart-1/10 text-chart-1' },
  compra_simple: { icon: ShoppingBag, color: 'bg-chart-1/10 text-chart-1' },
  orden_compra: { icon: ShoppingCart, color: 'bg-chart-1/10 text-chart-1' },
  pago_registrado: { icon: Wallet, color: 'bg-chart-2/10 text-chart-2' },
  pago_ejecutado: { icon: Wallet, color: 'bg-chart-2/10 text-chart-2' },
  cobro: { icon: Receipt, color: 'bg-chart-2/10 text-chart-2' },
  comprobante: { icon: Receipt, color: 'bg-chart-2/10 text-chart-2' },
  turno_abierto: { icon: Clock, color: 'bg-chart-3/10 text-chart-3' },
  turno_cerrado: { icon: Clock, color: 'bg-chart-3/10 text-chart-3' },
  planilla: { icon: ClipboardList, color: 'bg-chart-5/10 text-chart-5' },
}

const RECENT_ACTIVITY_LIMIT = 15

function groupActivityByDay(items: UserActivityItem[]) {
  const groups: { key: string; label: string; items: UserActivityItem[] }[] = []
  for (const item of items) {
    const key = dayKey(item.fecha)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, label: dayLabel(item.fecha), items: [item] })
    }
  }
  return groups
}

const COUNT_LABELS: Record<keyof UserActivityCounts, string> = {
  requerimientos: 'requerimientos creados',
  requerimientosRecepcionados: 'requerimientos recepcionados',
  ordenesCompra: 'OC creadas',
  ordenesCompraAprobadas: 'OC aprobadas',
  comprasSimplesCreadas: 'compras simples creadas',
  comprasSimplesAprobadasInformalmente: 'compras simples aprobadas (informal)',
  compraSimpleArchivosSubidos: 'archivos subidos a compras simples',
  solicitudesCotizacionAprobadasComoSolicitante: 'cotizaciones aprobadas (solicitante)',
  solicitudesCotizacionAprobadasComoGerencia: 'cotizaciones aprobadas (gerencia)',
  cotizacionesCreadas: 'cotizaciones creadas',
  pagosRegistrados: 'pagos registrados',
  pagosEjecutados: 'pagos ejecutados',
  comprobantesGenerados: 'comprobantes generados',
  pagosRecurrentesCreados: 'pagos recurrentes creados',
  cobrosRegistrados: 'cobros registrados',
  cobrosMarcados: 'cobros marcados',
  turnosAbiertos: 'turnos abiertos',
  turnosCerrados: 'turnos cerrados',
  turnosCorregidos: 'turnos corregidos',
  registrosVisitaComoVisitante: 'visitas propias registradas',
  registrosVisitaRegistradosPor: 'visitas registradas a otros',
  visitasTerceroRegistradas: 'visitas de terceros registradas',
  planillasGeneradas: 'planillas generadas',
  planillasStaffGeneradas: 'planillas de staff generadas',
  proyectosComoSupervisor: 'proyectos supervisados',
  notificaciones: 'notificaciones recibidas',
  helpVideosCreados: 'videos de ayuda creados',
}

interface CountGroup {
  label: string | null
  keys: (keyof UserActivityCounts)[]
}

// Solo los contadores que ya tienen una vista filtrable del lado del listado enlazan a ella.
// El resto de módulos aún no soporta filtrar por usuario (ver conversación en la ficha de usuario).
const COUNT_LINKS: Partial<Record<keyof UserActivityCounts, (userId: string, userName: string) => string>> = {
  pagosRegistrados: (userId, userName) =>
    `/pagos/historial?registradoPorId=${userId}&registradoPorNombre=${encodeURIComponent(userName)}`,
}

const COUNT_CATEGORIES: { label: string; groups: CountGroup[] }[] = [
  {
    label: 'Abastecimiento',
    groups: [
      {
        label: 'Creación',
        keys: ['requerimientos', 'ordenesCompra', 'comprasSimplesCreadas', 'cotizacionesCreadas'],
      },
      {
        label: 'Aprobación',
        keys: [
          'requerimientosRecepcionados',
          'ordenesCompraAprobadas',
          'comprasSimplesAprobadasInformalmente',
          'solicitudesCotizacionAprobadasComoSolicitante',
          'solicitudesCotizacionAprobadasComoGerencia',
        ],
      },
      {
        label: null,
        keys: ['compraSimpleArchivosSubidos'],
      },
    ],
  },
  {
    label: 'Finanzas',
    groups: [
      {
        label: 'Registro',
        keys: ['pagosRegistrados', 'pagosRecurrentesCreados', 'cobrosRegistrados'],
      },
      {
        label: 'Ejecución',
        keys: ['pagosEjecutados', 'comprobantesGenerados', 'cobrosMarcados'],
      },
    ],
  },
  {
    label: 'Turnos y visitas',
    groups: [
      {
        label: 'Turnos',
        keys: ['turnosAbiertos', 'turnosCerrados', 'turnosCorregidos'],
      },
      {
        label: 'Visitas',
        keys: ['registrosVisitaComoVisitante', 'registrosVisitaRegistradosPor', 'visitasTerceroRegistradas'],
      },
    ],
  },
  {
    label: 'Proyectos y planillas',
    groups: [
      {
        label: null,
        keys: ['proyectosComoSupervisor', 'planillasGeneradas', 'planillasStaffGeneradas'],
      },
    ],
  },
  {
    label: 'Otros',
    groups: [
      {
        label: null,
        keys: ['notificaciones', 'helpVideosCreados'],
      },
    ],
  },
]

const ESTADO_LABELS: Record<string, string> = {
  presente: 'Presente',
  tardio: 'Tardío',
  falta: 'Falta',
}

const ESTADO_COLORS: Record<string, string> = {
  presente: 'bg-chart-2/15 text-chart-2',
  tardio: 'bg-amber-500/10 text-amber-600',
  falta: 'bg-destructive/10 text-destructive',
}

export default async function UsuarioDetailPage({ params }: Props) {
  const { id } = await params
  const [result, auditLog] = await Promise.all([
    serverFetch<UserActivity>(`/users/${id}/actividad`).catch((e: Error) => e),
    serverFetch<AuditLogPage>(`/users/${id}/auditoria?page=1&pageSize=50`).catch(
      () => ({ items: [], total: 0, page: 1, pageSize: 50 }) as AuditLogPage,
    ),
  ])

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el usuario.</p>
  }

  const { user, counts, trabajador, actividadReciente } = result
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const activeCategories = COUNT_CATEGORIES.map((cat) => ({
    label: cat.label,
    groups: cat.groups
      .map((group) => ({
        label: group.label,
        items: group.keys
          .map((key) => ({ key, value: counts[key] }))
          .filter((item) => item.value > 0),
      }))
      .filter((group) => group.items.length > 0),
  })).filter((cat) => cat.groups.length > 0)

  const totalAcciones = Object.values(counts).reduce((sum, v) => sum + v, 0)
  const recentActivity = actividadReciente.slice(0, RECENT_ACTIVITY_LIMIT)
  const remainingActivity = actividadReciente.length - recentActivity.length
  const activityGroups = groupActivityByDay(recentActivity)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a usuarios
        </Link>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground select-none">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight">{user.name}</h1>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
                <span className="font-mono">{user.email}</span>
                <span className="text-border">·</span>
                <span>Registrado {fmt(user.createdAt)}</span>
                <span className="text-border">·</span>
                <span>{totalAcciones} acciones realizadas</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <ImpersonateButtonHeader targetUser={{ ...user, cargo: trabajador?.cargo ?? null }} />
            <Link
              href={`/usuarios/${id}/editar`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <Pencil className="size-3.5" />
              Editar
            </Link>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Actividad reciente</h2>
          {actividadReciente.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {recentActivity.length} de {actividadReciente.length} acciones
            </span>
          )}
        </div>
        {actividadReciente.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
        ) : (
          <div className="space-y-4">
            {activityGroups.map((group) => (
              <div key={group.key}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {group.items.map((item) => {
                    const meta = TIPO_META[item.tipo]
                    const Icon = meta.icon
                    return (
                      <li
                        key={`${item.tipo}-${item.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm"
                      >
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-md',
                            meta.color,
                          )}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.etiqueta}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {fmtTime(item.fecha)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            {remainingActivity > 0 && (
              <p className="text-xs text-muted-foreground">
                +{remainingActivity} acciones más antiguas. Ver el registro completo abajo.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={cn('grid gap-4', trabajador ? 'lg:grid-cols-4' : 'lg:grid-cols-1')}>
        {/* Información del trabajador */}
        {trabajador && (
          <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-1">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Información
            </h2>
            <dl className="space-y-3 text-sm">
              <InfoRow
                icon={<Briefcase className="size-4" />}
                label="Vinculado a trabajador"
                value={`${trabajador.nombre}${trabajador.cargo ? ` — ${trabajador.cargo}` : ''}`}
              />
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-muted-foreground shrink-0">
                  <Activity className="size-4" />
                </span>
                <div>
                  <dt className="text-xs text-muted-foreground">Estado del trabajador</dt>
                  <dd>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        trabajador.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {trabajador.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        )}

        {/* Resumen por módulo */}
        <div className={cn('rounded-xl border border-border bg-white p-5 space-y-4', trabajador && 'lg:col-span-3')}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resumen de actividad por módulo
          </h2>
          {activeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
          ) : (
            <div className="space-y-5">
              {activeCategories.map((cat) => (
                <div key={cat.label}>
                  <h3 className="mb-2 text-xs font-medium text-foreground/80">{cat.label}</h3>
                  <div className="space-y-3">
                    {cat.groups.map((group) => (
                      <div key={group.label ?? '_'}>
                        {group.label && (
                          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                            {group.label}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {group.items.map((item) => {
                            const href = COUNT_LINKS[item.key]?.(id, user.name)
                            const content = (
                              <>
                                <div className="text-xl font-semibold tabular-nums leading-tight">
                                  {item.value}
                                </div>
                                <div className="text-xs text-muted-foreground leading-snug">
                                  {COUNT_LABELS[item.key]}
                                </div>
                              </>
                            )
                            return href ? (
                              <Link
                                key={item.key}
                                href={href}
                                className="rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                              >
                                {content}
                              </Link>
                            ) : (
                              <div key={item.key} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                                {content}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Asistencias */}
        {trabajador && (
          <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Asistencias recientes
            </h2>
            {trabajador.asistencias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin asistencias registradas.</p>
            ) : (
              <ul className="divide-y divide-border">
                {trabajador.asistencias.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{fmt(a.turno.fecha)}</span>
                      <span className="text-muted-foreground"> — {a.turno.proyecto.nombre}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {(Number(a.horasExtra) > 0) && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          +{a.horasExtra}h extra
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          ESTADO_COLORS[a.estado],
                        )}
                      >
                        {ESTADO_LABELS[a.estado]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <AuditLogSection userId={id} initial={auditLog} />
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  )
}
