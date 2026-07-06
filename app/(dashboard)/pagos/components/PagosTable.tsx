import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { Pago } from '@/types/api'
import { cn, formatDateOnly } from '@/lib/utils'

const ESTADO_LABEL: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  pagado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

export async function PagosTable() {
  const pagos = await serverFetch<Pago[]>('/pagos').catch(() => [] as Pago[])

  if (pagos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">No hay pagos registrados</p>
        <p className="text-xs text-muted-foreground">Los pagos se programan desde el detalle de cada orden de compra.</p>
      </div>
    )
  }

  const ordenados = [...pagos].sort((a, b) => {
    const rank = { vencido: 0, pendiente: 1, pagado: 2, cancelado: 3 }
    return rank[a.estadoEfectivo] - rank[b.estadoEfectivo]
      || new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime()
  })

  return (
    <div className="rounded-xl border border-border bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Orden de compra</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proveedor</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ordenados.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30 transition-colors duration-[120ms]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {p.estadoEfectivo === 'vencido' && <AlertTriangle className="size-3.5 text-destructive" />}
                  {formatDateOnly(p.fechaProgramada)}
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/ordenes-compra/${p.ordenCompraId}`} className="font-mono font-medium hover:text-primary transition-colors duration-[120ms]">
                  {p.ordenCompra.numero}
                </Link>
              </td>
              <td className="px-4 py-3 font-medium">{p.ordenCompra.proveedor.razonSocial}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <Link href={`/proyectos/${p.ordenCompra.proyecto.id}`} className="hover:text-foreground transition-colors duration-[120ms]">
                  {p.ordenCompra.proyecto.codigo ?? p.ordenCompra.proyecto.nombre}
                </Link>
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                S/ {Number(p.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">
                <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[p.estadoEfectivo])}>
                  {ESTADO_LABEL[p.estadoEfectivo]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
