import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { EstadoOrdenCompra, OrdenCompra } from '@/types/api'
import { cn } from '@/lib/utils'

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recep. parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-blue-500/10 text-blue-600',
  recibida_parcial: 'bg-amber-500/10 text-amber-600',
  recibida: 'bg-chart-2/10 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

export async function ProyectoOrdenesCompraSection({ proyectoId }: { proyectoId: string }) {
  const ordenes = await serverFetch<OrdenCompra[]>(`/ordenes-compra?proyectoId=${proyectoId}`).catch(() => [] as OrdenCompra[])

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Órdenes de compra ({ordenes.length})
        </h2>
        <Link
          href={`/ordenes-compra?proyectoId=${proyectoId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
        >
          Ver todas
        </Link>
      </div>

      {ordenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <ShoppingCart className="size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Sin órdenes de compra</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">N° OC</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proveedor</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Monto</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha emisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenes.map((oc) => (
                <tr key={oc.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/ordenes-compra/${oc.id}`}
                      className="font-mono font-medium hover:underline underline-offset-2"
                    >
                      {oc.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{oc.proveedor.razonSocial}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    S/ {Number(oc.montoTotal).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[oc.estado])}>
                      {ESTADO_LABEL[oc.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {oc.fechaEmision
                      ? new Date(oc.fechaEmision).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
