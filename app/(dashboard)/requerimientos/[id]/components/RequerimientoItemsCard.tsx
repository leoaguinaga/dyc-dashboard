'use client'

import { useSession } from '@/lib/auth/session'
import { UNIDAD_ABBR } from '@/lib/inventario'
import { RequerimientoEditForm } from './RequerimientoEditForm'
import type { Requerimiento } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
}

export function RequerimientoItemsCard({ requerimiento: r }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const isEditor = r.creadoPorId === session?.user?.id || role === 'administrador'

  if (r.estado === 'observado' && isEditor) {
    return <RequerimientoEditForm requerimiento={r} />
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Ítems solicitados ({r.items.length})
      </h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Cantidad</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {r.items.map((item, i) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.descripcion}</td>
                <td className="px-4 py-3 text-right tabular-nums font-mono text-sm">
                  {Number(item.cantidad).toLocaleString('es-PE')}
                  <span className="ml-1 text-xs text-muted-foreground">{UNIDAD_ABBR[item.unidad]}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{item.nota ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
