import Link from 'next/link'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UNIDAD_ABBR } from '@/lib/inventario'
import type { ItemSolicitadoProveedor, EstadoCotizacion } from '@/types/api'

const ESTADO_STYLES: Record<EstadoCotizacion, { label: string; cn: string }> = {
  pendiente:      { label: 'Pendiente',     cn: 'bg-muted text-muted-foreground' },
  recibida:       { label: 'Recibida',      cn: 'bg-chart-2/15 text-chart-2' },
  aprobada:       { label: 'Aprobada',      cn: 'bg-chart-2/15 text-chart-2' },
  rechazada:      { label: 'Rechazada',     cn: 'bg-destructive/10 text-destructive' },
  sin_respuesta:  { label: 'Sin respuesta', cn: 'bg-orange-500/15 text-orange-600' },
}

function fmt(val: string) {
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  items: ItemSolicitadoProveedor[]
}

export function ItemsSolicitadosSection({ items }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Productos solicitados ({items.length})
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
          <Package className="size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no se le han solicitado productos a este proveedor
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Cant.</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Unidad</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Precio unit.</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitud</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const estado = ESTADO_STYLES[item.cotizacion.estado]
                return (
                  <tr key={item.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{item.descripcionProveedor}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(item.cantidad)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{UNIDAD_ABBR[item.unidad]}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-sm">
                      {parseFloat(item.precioUnit) > 0 ? `S/ ${fmt(item.precioUnit)}` : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cotizaciones/${item.cotizacion.solicitud.id}`}
                        className="text-xs font-mono text-primary hover:underline underline-offset-2"
                      >
                        {item.cotizacion.solicitud.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', estado.cn)}>
                        {estado.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
