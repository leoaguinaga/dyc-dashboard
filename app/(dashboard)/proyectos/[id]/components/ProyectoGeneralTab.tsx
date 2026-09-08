import Link from 'next/link'
import {
  MapPin,
  Calendar,
  Users,
  Globe,
  FileText,
  FolderTree,
  FolderOpen,
  ExternalLink,
  Mail,
  Phone,
  Target,
  ArrowRight,
} from 'lucide-react'
import { cn, formatDateOnly } from '@/lib/utils'
import type { Proyecto } from '@/types/api'

interface Props {
  proyecto: Proyecto
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

const AMBITO_LABELS: Record<string, string> = {
  local: 'Local',
  nacional: 'Nacional',
  internacional: 'Internacional',
}

export function ProyectoGeneralTab({ proyecto: o }: Props) {
  const hitos = o.hitos ?? []
  // Obtenemos los próximos 3 hitos que aún no están cumplidos, o los primeros 3
  const hitosPendientes = hitos.filter((h) => h.cumplimiento !== 'si')
  const hitosProximos = (hitosPendientes.length > 0 ? hitosPendientes : hitos).slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Columna Lateral: Ficha Técnica, Ubicación, Documentación y Subproyectos */}
      <div className="space-y-4 lg:col-span-4">
        {/* Identificación y Ubicación */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ficha técnica y ubicación
          </h2>
          <dl className="space-y-3.5 text-sm">
            {o.ambitoGeografico && (
              <InfoRow icon={<Globe className="size-4" />} label="Ámbito geográfico">
                <span className="font-medium text-foreground">
                  {AMBITO_LABELS[o.ambitoGeografico] ?? o.ambitoGeografico}
                </span>
              </InfoRow>
            )}

            {(o.direccion || o.ciudad || o.comuna) ? (
              <InfoRow icon={<MapPin className="size-4" />} label="Dirección de la obra">
                <span className="font-medium text-foreground leading-snug">
                  {o.direccion}
                  {o.comuna && `, ${o.comuna}`}
                  {o.ciudad && `, ${o.ciudad}`}
                </span>
              </InfoRow>
            ) : (
              <InfoRow icon={<MapPin className="size-4" />} label="Dirección">
                <span className="text-muted-foreground">Sin ubicación registrada</span>
              </InfoRow>
            )}

            {(o.fechaInicioReal || o.fechaFinReal) && (
              <InfoRow icon={<Calendar className="size-4" />} label="Fechas reales de obra">
                <span className="font-medium tabular-nums text-foreground">
                  {o.fechaInicioReal ? formatDateOnly(o.fechaInicioReal) : '—'} →{' '}
                  {o.fechaFinReal ? formatDateOnly(o.fechaFinReal) : 'En curso'}
                </span>
              </InfoRow>
            )}

            {o.notaInicioReal && (
              <InfoRow icon={<FileText className="size-4" />} label="Nota inicio real">
                <span className="text-xs text-muted-foreground leading-relaxed">{o.notaInicioReal}</span>
              </InfoRow>
            )}
          </dl>

          {/* Enlace OneDrive */}
          {o.enlaceOneDrive && (
            <div className="pt-2 border-t border-border">
              <a
                href={o.enlaceOneDrive}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/70 hover:text-primary group"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="size-4 text-primary shrink-0" />
                  <span>Carpeta en OneDrive</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          )}
        </div>

        {/* Subproyectos */}
        {o.subproyectos && o.subproyectos.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subproyectos vinculados ({o.subproyectos.length})
            </h2>
            <div className="space-y-2">
              {o.subproyectos.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/proyectos/${sub.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-2.5 text-xs transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderTree className="size-4 text-muted-foreground shrink-0" />
                    <div className="truncate">
                      {sub.codigo && (
                        <span className="font-mono text-muted-foreground mr-1.5">{sub.codigo}</span>
                      )}
                      <span className="font-medium text-foreground">{sub.nombre}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium ml-2',
                      ESTADO_STYLES[sub.estado] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {ESTADO_LABELS[sub.estado] ?? sub.estado}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna Principal: Staff de Coordinación & Resumen de Cronograma */}
      <div className="space-y-4 lg:col-span-8">
        {/* Staff Asignado */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Equipo de coordinación y supervisión
            </h2>
          </div>

          {!o.coordinadorEmpresa && !o.coordinadorCliente && !o.ejecutor && !o.prevencionista ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2 rounded-lg border border-dashed border-border">
              <Users className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin personal de coordinación asignado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {o.coordinadorEmpresa && (
                <PersonaCard
                  rol="Coordinador empresa"
                  nombre={o.coordinadorEmpresa.nombre}
                  puesto={o.coordinadorEmpresa.cargo}
                  href={`/trabajadores/${o.coordinadorEmpresa.id}`}
                  email={o.coordinadorEmpresa.email}
                  telefono={o.coordinadorEmpresa.telefono}
                />
              )}
              {o.coordinadorCliente && (
                <PersonaCard
                  rol="Coordinador cliente"
                  nombre={o.coordinadorCliente.nombre}
                  puesto={o.coordinadorCliente.cargo}
                  href={o.cliente?.id ? `/clientes/${o.cliente.id}` : undefined}
                  email={o.coordinadorCliente.email}
                  telefono={o.coordinadorCliente.telefono}
                />
              )}
              {o.ejecutor && (
                <PersonaCard
                  rol="Ejecutor / Residente"
                  nombre={o.ejecutor.nombre}
                  puesto={o.ejecutor.cargo}
                  href={`/trabajadores/${o.ejecutor.id}`}
                  email={o.ejecutor.email}
                  telefono={o.ejecutor.telefono}
                />
              )}
              {o.prevencionista && (
                <PersonaCard
                  rol="Prevencionista (PDR)"
                  nombre={o.prevencionista.nombre}
                  puesto={o.prevencionista.cargo}
                  href={`/trabajadores/${o.prevencionista.id}`}
                  email={o.prevencionista.email}
                  telefono={o.prevencionista.telefono}
                />
              )}
            </div>
          )}
        </div>

        {/* Resumen de Hitos Próximos */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Próximos hitos de cronograma
            </h2>
            <Link
              href={`/proyectos/${o.id}?tab=planificacion`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
            >
              <span>Ver todos los hitos</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {hitosProximos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-1.5 rounded-lg border border-dashed border-border">
              <Target className="size-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No hay hitos programados en este proyecto.</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-muted/20">
              {hitosProximos.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 text-sm gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{h.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.responsable?.nombre ? `Responsable: ${h.responsable.nombre}` : 'Sin responsable'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDateOnly(h.fechaProgramada)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                        h.cumplimiento === 'si'
                          ? 'bg-chart-2/15 text-chart-2'
                          : h.cumplimiento === 'no'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-blue-500/15 text-blue-600',
                      )}
                    >
                      {h.cumplimiento === 'si'
                        ? 'Cumplido'
                        : h.cumplimiento === 'no'
                          ? 'No cumplido'
                          : 'Programado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PersonaCard({
  rol,
  nombre,
  puesto,
  href,
  email,
  telefono,
}: {
  rol: string
  nombre: string
  puesto?: string
  href?: string
  email?: string
  telefono?: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{rol}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
          {href ? (
            <Link
              href={href}
              className="text-sm font-semibold text-foreground hover:text-primary hover:underline underline-offset-4 transition-colors"
            >
              {nombre}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-foreground">{nombre}</span>
          )}
          {puesto && <span className="text-xs text-muted-foreground">· {puesto}</span>}
        </div>
      </div>

      {(email || telefono) && (
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50 text-xs">
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="size-3 text-muted-foreground/70" />
              <span className="truncate max-w-[170px]">{email}</span>
            </a>
          )}
          {telefono && (
            <a
              href={`tel:${telefono}`}
              className="inline-flex items-center gap-1 font-mono tabular-nums text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="size-3 text-muted-foreground/70" />
              <span>{telefono}</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground/70">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  )
}
