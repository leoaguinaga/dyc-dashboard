import Link from 'next/link'
import { AlertTriangle, Wallet } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { Pago } from '@/types/api'
import { cn } from '@/lib/utils'

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

export async function ProyectoPagosPendientesSection({ proyectoId }: { proyectoId: string }) {
  const pagos = await serverFetch<Pago[]>(`/pagos?proyectoId=${proyectoId}&estado=pendiente`).catch(() => [] as Pago[])

  const ordenados = [...pagos].sort(
    (a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime(),
  )

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pagos pendientes ({ordenados.length})
        </h2>
      </div>

      {ordenados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <Wallet className="size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Sin pagos pendientes</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Orden de compra</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proveedor</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Monto</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenados.map((p) => (
                <tr key={p.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    <div className="flex items-center gap-1.5">
                      {p.estadoEfectivo === 'vencido' && <AlertTriangle className="size-3.5 text-destructive" />}
                      {new Date(p.fechaProgramada).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/ordenes-compra/${p.ordenCompraId}`} className="font-mono font-medium hover:underline underline-offset-2">
                      {p.ordenCompra.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.ordenCompra.proveedor.razonSocial}</td>
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
      )}
    </div>
  )
}
