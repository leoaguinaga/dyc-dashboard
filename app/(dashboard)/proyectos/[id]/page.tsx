import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarCheck2,
  MapPin,
  Pencil,
  ClipboardCheck,
} from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { Button } from '@/components/ui/button'
import { cn, formatDateOnly } from '@/lib/utils'
import { ProyectoKpiStrip } from './components/ProyectoKpiStrip'
import { ProyectoTabsClient, type TabItem } from './components/ProyectoTabsClient'
import { ProyectoGeneralTab } from './components/ProyectoGeneralTab'
import { ProyectoTrabajadoresSection } from './components/ProyectoTrabajadoresSection'
import { ProyectoSupervisoresSection } from './components/ProyectoSupervisoresSection'
import { ProyectoHitosSection } from './components/ProyectoHitosSection'
import { ProyectoOrdenesCompraSection } from './components/ProyectoOrdenesCompraSection'
import { ProyectoPagosPendientesSection } from './components/ProyectoPagosPendientesSection'
import { CierreObraSection } from './components/CierreObraSection'
import { TomarAsistenciaButton } from './components/TomarAsistenciaButton'
import {
  GeneralTabSkeleton,
  EquipoTabSkeleton,
  PlanificacionTabSkeleton,
  ComprasTabSkeleton,
  CierreTabSkeleton,
} from './components/ProyectoTabSkeletons'
import type { Proyecto, Role, Trabajador, User, OrdenCompra, Pago } from '@/types/api'

const CON_ACCESO_EDICION: Role[] = ['administrador', 'admin_ti', 'gerencia']

interface Props {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ tab?: string }>
}

const ESTADO_STYLES: Record<string, string> = {
  planificacion: 'bg-blue-500/15 text-blue-600',
  ejecucion: 'bg-chart-2/15 text-chart-2',
  cierre: 'bg-amber-500/15 text-amber-600',
  liquidada: 'bg-muted text-muted-foreground',
}

const ESTADO_LABELS: Record<string, string> = {
  planificacion: 'Planificación',
  ejecucion: 'Ejecución',
  cierre: 'Cierre',
  liquidada: 'Liquidada',
}

export default async function ProyectoDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const queryParams = searchParams ? await searchParams : {}
  const initialTab = queryParams.tab ?? 'general'

  const [result, trabajadores, user, ordenes, pagos] = await Promise.all([
    serverFetch<Proyecto>(`/proyectos/${id}`).catch((e: Error) => e),
    serverFetch<Trabajador[]>('/trabajadores').catch(() => [] as Trabajador[]),
    serverFetch<User>('/users/me').catch(() => null),
    serverFetch<OrdenCompra[]>(`/ordenes-compra?proyectoId=${id}`).catch(() => [] as OrdenCompra[]),
    serverFetch<Pago[]>(`/pagos?proyectoId=${id}&estado=pendiente`).catch(() => [] as Pago[]),
  ])

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el proyecto.</p>
  }

  const o = result
  const puedeEditar = !!user && CON_ACCESO_EDICION.includes(user.role)
  const puedeAsignarSupervisores =
    user?.role === 'administrador' || user?.role === 'admin_ti' || user?.role === 'gerencia'
  const puedeAsignarTrabajadores =
    user?.role === 'administrador' ||
    user?.role === 'admin_ti' ||
    user?.role === 'gerencia' ||
    user?.role === 'logistica'
  const puedeCerrar =
    user?.role === 'administrador' || user?.role === 'admin_ti' || user?.role === 'gerencia'
  const estaCerrada = o.estado === 'cierre' || o.estado === 'liquidada'

  const usuarios = puedeAsignarSupervisores
    ? await serverFetch<User[]>('/users').catch(() => [] as User[])
    : []

  // Conteos para los badges de navegación en pestañas
  const hitosCount = o.hitos?.length ?? 0
  const operariosActivos = (o.trabajadores ?? []).filter((t) => !t.fechaSalida).length
  const supervisoresCount = (o.supervisores ?? []).length
  const equipoTotal = operariosActivos + supervisoresCount
  const comprasValidas = ordenes.filter((oc) => oc.estado !== 'cancelada').length
  const finanzasCount = comprasValidas + pagos.length

  // Configuración de las pestañas funcionales con sus respectivos Skeletons para Suspense
  const tabs: TabItem[] = [
    {
      id: 'general',
      label: 'General',
      fallback: <GeneralTabSkeleton />,
      content: <ProyectoGeneralTab proyecto={o} />,
    },
    {
      id: 'equipo',
      label: 'Equipo & Asistencia',
      count: equipoTotal,
      fallback: <EquipoTabSkeleton />,
      content: (
        <div className="space-y-4">
          {/* Banner contextual de Asistencia diaria */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Control diario de asistencia</h3>
                <p className="text-xs text-muted-foreground">
                  Gestiona turnos, registros de entrada/salida y visitas de terceros para este proyecto.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <TomarAsistenciaButton proyectoId={id} />
            </div>
          </div>

          {/* Secciones de Operadores y Supervisores */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ProyectoTrabajadoresSection
              proyectoId={o.id}
              initialItems={o.trabajadores ?? []}
              todos={trabajadores}
              canEdit={puedeAsignarTrabajadores}
            />
            {puedeAsignarSupervisores && (
              <ProyectoSupervisoresSection
                proyectoId={o.id}
                initialItems={o.supervisores ?? []}
                usuarios={usuarios}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'planificacion',
      label: 'Planificación',
      count: hitosCount,
      fallback: <PlanificacionTabSkeleton />,
      content: (
        <ProyectoHitosSection
          proyectoId={o.id}
          initialHitos={o.hitos ?? []}
          trabajadores={trabajadores}
          canEdit={puedeEditar}
        />
      ),
    },
    {
      id: 'compras',
      label: 'Compras & Pagos',
      count: finanzasCount,
      fallback: <ComprasTabSkeleton />,
      content: (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ProyectoOrdenesCompraSection proyectoId={o.id} initialOrdenes={ordenes} />
          <ProyectoPagosPendientesSection proyectoId={o.id} initialPagos={pagos} />
        </div>
      ),
    },
  ]

  // Pestaña condicional de Cierre de Obra
  if (puedeCerrar || estaCerrada) {
    tabs.push({
      id: 'cierre',
      label: 'Cierre de Obra',
      badge: estaCerrada ? (o.estado === 'liquidada' ? 'Liquidada' : 'En Cierre') : undefined,
      fallback: <CierreTabSkeleton />,
      content: <CierreObraSection proyecto={o} />,
    })
  }

  return (
    <div className="space-y-4">
      {/* Cabecera y Navegación de Breadcrumb */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            href="/proyectos"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Proyectos</span>
          </Link>
          {o.parent && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <Link
                href={`/proyectos/${o.parent.id}`}
                className="transition-colors hover:text-foreground truncate max-w-[200px]"
              >
                {o.parent.nombre}
              </Link>
            </>
          )}
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono text-foreground font-medium">{o.codigo ?? o.id.slice(0, 8)}</span>
        </div>

        {/* Título Principal y Barra de Acciones */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3.5">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building2 className="size-5.5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {o.nombre}
                </h1>
                {o.codigo && (
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-medium text-muted-foreground">
                    {o.codigo}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium',
                    ESTADO_STYLES[o.estado] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {ESTADO_LABELS[o.estado] ?? o.estado}
                </span>
              </div>

              {/* Metadatos Rápidos */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {o.cliente && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <span className="text-muted-foreground font-normal">Cliente:</span>
                    <Link
                      href={`/clientes/${o.cliente.id}`}
                      className="hover:text-primary hover:underline underline-offset-2"
                    >
                      {o.cliente.nombreComercial ?? o.cliente.razonSocial}
                    </Link>
                  </span>
                )}

                {(o.fechaInicio || o.fechaFin) && (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="size-3.5 text-muted-foreground/70" />
                    <span>
                      Prog: {o.fechaInicio ? formatDateOnly(o.fechaInicio) : '—'} →{' '}
                      {o.fechaFin ? formatDateOnly(o.fechaFin) : '—'}
                    </span>
                  </span>
                )}

                {(o.fechaInicioReal || o.fechaFinReal) && (
                  <span className="flex items-center gap-1.5 tabular-nums text-foreground/80">
                    <CalendarCheck2 className="size-3.5 text-chart-2" />
                    <span>
                      Real: {o.fechaInicioReal ? formatDateOnly(o.fechaInicioReal) : '—'} →{' '}
                      {o.fechaFinReal ? formatDateOnly(o.fechaFinReal) : 'En curso'}
                    </span>
                  </span>
                )}

                {(o.direccion || o.ciudad) && (
                  <span className="flex items-center gap-1.5 truncate max-w-[280px]">
                    <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
                    <span className="truncate">
                      {[o.direccion, o.comuna, o.ciudad].filter(Boolean).join(', ')}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones Principales */}
          <div className="flex items-end gap-2 self-start sm:self-end shrink-0">
            <TomarAsistenciaButton proyectoId={id} />
            {puedeEditar && (
              <Link href={`/proyectos/${id}/editar`}>
                <Button variant="outline" className="gap-1.5">
                  <Pencil className="size-3.5" />
                  Editar proyecto
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pulso del Proyecto: Strip de KPIs Ejecutivos */}
      <ProyectoKpiStrip proyecto={o} ordenes={ordenes} pagos={pagos} />

      {/* Navegación por Pestañas y Contenido Funcional con Suspense por Tab */}
      <ProyectoTabsClient tabs={tabs} defaultTab={initialTab} />
    </div>
  )
}
