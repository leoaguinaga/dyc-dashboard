import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, CalendarDays, Pencil, Briefcase, Tag } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ContactosProveedorSection } from './components/ContactosProveedorSection'
import { ComprasProveedorSection } from './components/ComprasProveedorSection'
import { EvaluacionProveedorSection } from './components/EvaluacionProveedorSection'
import type { Proveedor, CotizacionConHistorial, ProveedorEvaluacion } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

function esComprada(c: CotizacionConHistorial) {
  return c.estado === 'aprobada' || c.items.some((i) => i.seleccionado)
}

function resumenCompras(cotizaciones: CotizacionConHistorial[]) {
  const compradas = cotizaciones.filter(esComprada)
  let total = 0
  const porProducto = new Map<string, { nombre: string; cantidad: number; unidad: string; count: number }>()
  for (const c of compradas) {
    const sel = c.items.filter((i) => i.seleccionado)
    for (const i of sel.length > 0 ? sel : c.items) {
      const cant = parseFloat(i.cantidad) || 0
      total += cant * (parseFloat(i.precioUnit) || 0)
      const key = i.descripcionProveedor.trim().toUpperCase()
      const prev = porProducto.get(key)
      porProducto.set(key, {
        nombre: i.descripcionProveedor,
        cantidad: (prev?.cantidad ?? 0) + cant,
        unidad: i.unidad,
        count: (prev?.count ?? 0) + 1,
      })
    }
  }
  const top = [...porProducto.values()].sort((a, b) => b.count - a.count || b.cantidad - a.cantidad)[0]
  const ultima = compradas
    .map((c) => c.fechaRecibida ?? c.creadoEn)
    .sort()
    .at(-1)
  return { compradas: compradas.length, total, top, ultima, cotizadas: cotizaciones.length }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ProveedorDetailPage({ params }: Props) {
  const { id } = await params
  const [result, cotizaciones, evaluacion] = await Promise.all([
    serverFetch<Proveedor>(`/proveedores/${id}`).catch((e: Error) => e),
    serverFetch<CotizacionConHistorial[]>(`/proveedores/${id}/cotizaciones`).catch(() => [] as CotizacionConHistorial[]),
    serverFetch<ProveedorEvaluacion>(`/proveedores/${id}/evaluacion`).catch(
      () => null as ProveedorEvaluacion | null,
    ),
  ])

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el proveedor.</p>
  }

  const p = result
  const initials = p.razonSocial
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const resumen = resumenCompras(cotizaciones)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a proveedores
        </Link>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground select-none">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight">{p.razonSocial}</h1>
              {p.ruc && (
                <p className="text-sm text-muted-foreground font-mono">RUC {p.ruc}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                p.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
              )}
            >
              {p.activo ? 'Activo' : 'Inactivo'}
            </span>
            <Link
              href={`/proveedores/${id}/editar`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              <Pencil className="size-3.5" />
              Editar
            </Link>
          </div>
        </div>
      </div>

      {/* Resumen de la relación comercial */}
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Kpi label="Comprado (adjudicado)" className="col-span-2 lg:col-span-1">
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            <span className="mr-1 text-sm font-medium text-muted-foreground">S/</span>
            {resumen.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {resumen.compradas} compra{resumen.compradas === 1 ? '' : 's'}
          </p>
        </Kpi>
        <Kpi label="Lo que más se le compra">
          {resumen.top ? (
            <>
              <p className="mt-1.5 text-sm font-medium leading-snug">{resumen.top.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {resumen.top.count} compra{resumen.top.count === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">—</p>
          )}
        </Kpi>
        <Kpi label="Última compra">
          <p className="mt-1.5 text-sm font-medium">{resumen.ultima ? fmt(resumen.ultima) : '—'}</p>
        </Kpi>
        <Kpi label="Cotizó / ganó">
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {resumen.cotizadas}
            <span className="mx-1 text-base font-medium text-muted-foreground">/</span>
            {resumen.compradas}
          </p>
        </Kpi>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <ComprasProveedorSection cotizaciones={cotizaciones} />

        <aside className="space-y-4 max-lg:order-first">
          <ContactosProveedorSection proveedorId={p.id} contactos={p.contactos ?? []} />
          {evaluacion && <EvaluacionProveedorSection evaluacion={evaluacion} />}

          <div className="space-y-4 rounded-xl border border-border bg-white p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información</h2>
            <dl className="space-y-3 text-sm">
              {p.rubro && <InfoRow icon={<Briefcase className="size-4" />} label="Rubro" value={p.rubro} />}
              {p.categoria && <InfoRow icon={<Tag className="size-4" />} label="Categoría" value={p.categoria} />}
              {p.departamento && (
                <InfoRow
                  icon={<MapPin className="size-4" />}
                  label="Ubicación"
                  value={p.distrito ? `${p.distrito}, ${p.departamento}` : p.departamento}
                />
              )}
              {p.direccion && <InfoRow icon={<MapPin className="size-4" />} label="Dirección" value={p.direccion} />}
              {p.creadoEn && (
                <InfoRow icon={<CalendarDays className="size-4" />} label="Registrado" value={fmt(p.creadoEn)} />
              )}
              {!p.rubro && !p.categoria && !p.direccion && !p.departamento && (
                <p className="text-muted-foreground">Sin información adicional</p>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Kpi({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('border-l border-t border-border px-5 py-4 first:border-l-0 first:border-t-0 lg:border-t-0', className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={cn('font-medium', mono && 'font-mono')}>{value}</dd>
      </div>
    </div>
  )
}
