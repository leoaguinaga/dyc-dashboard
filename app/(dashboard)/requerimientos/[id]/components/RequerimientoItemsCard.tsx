'use client'

import { FileText } from 'lucide-react'
import { API_ORIGIN } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { UNIDAD_ABBR } from '@/lib/inventario'
import { TIPO_APPROVERS } from '@/lib/requerimientos'
import { RequerimientoEditForm } from './RequerimientoEditForm'
import type { Requerimiento } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
}

export function RequerimientoItemsCard({ requerimiento: r }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const esCreador = r.creadoPorId === session?.user?.id || role === 'administrador'
  const esRevisor = role ? TIPO_APPROVERS[r.tipo].includes(role) : false

  // El solicitante corrige en "observado"; el revisor puede corregir directamente
  // mientras el requerimiento está "enviado", sin esperar a que el solicitante
  // actualice el sistema — el PDF se exporta tal cual queda en la BD.
  if (r.estado === 'observado' && esCreador) {
    return <RequerimientoEditForm requerimiento={r} mode="creador" />
  }
  if (r.estado === 'enviado' && esRevisor) {
    return <RequerimientoEditForm requerimiento={r} mode="revisor" />
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
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Archivos</th>
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
                <td className="px-4 py-3 text-sm">
                  {item.archivos?.length ? (
                    <div className="flex flex-col gap-1">
                      {item.archivos.map((archivo) => (
                        <a
                          key={archivo.id}
                          href={`${API_ORIGIN}${archivo.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="size-3.5 shrink-0" />
                          {archivo.nombre}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
