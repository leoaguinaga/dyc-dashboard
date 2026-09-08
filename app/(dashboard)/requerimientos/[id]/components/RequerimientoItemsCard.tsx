'use client'

import { useState } from 'react'
import { FileText, Pencil, ShieldAlert } from 'lucide-react'
import { API_ORIGIN } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { UNIDAD_ABBR } from '@/lib/inventario'
import { TIPO_APPROVERS } from '@/lib/requerimientos'
import { RequerimientoEditForm } from './RequerimientoEditForm'
import { Button } from '@/components/ui/button'
import type { Proyecto, Requerimiento, Role } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
  proyectos?: Proyecto[]
}

const ROLES_SOLICITANTE: Role[] = ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr']
const ROLES_GRUPO_B: Role[] = ['ing_civil', 'ing_electrico', 'jefe_sig', 'logistica', 'gerencia', 'administrador', 'admin_ti']
const ESTADOS_NO_APROBADO = ['borrador', 'enviado', 'observado']
const ESTADOS_PRE_COTIZACION = ['borrador', 'enviado', 'observado', 'aprobado']

export function RequerimientoItemsCard({ requerimiento: r, proyectos = [] }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const esCreador = r.creadoPorId === session?.user?.id
  const esSolicitante = esCreador || (role ? ROLES_SOLICITANTE.includes(role) : false)
  const esRevisor = role ? (TIPO_APPROVERS[r.tipo]?.includes(role) ?? false) : false
  const esGrupoB = role ? ROLES_GRUPO_B.includes(role) : false

  const canChangeObra =
    (esSolicitante && ESTADOS_NO_APROBADO.includes(r.estado)) ||
    (esGrupoB && ESTADOS_PRE_COTIZACION.includes(r.estado))

  const canEdit =
    (esSolicitante && ESTADOS_NO_APROBADO.includes(r.estado)) ||
    (esRevisor && r.estado === 'enviado') ||
    (esGrupoB && ESTADOS_PRE_COTIZACION.includes(r.estado))

  const editMode = role === 'admin_ti'
    ? 'admin_ti'
    : esRevisor && r.estado === 'enviado' && !esCreador
      ? 'revisor'
      : esSolicitante
        ? 'creador'
        : 'general'

  const [editando, setEditando] = useState(r.estado === 'observado' && esCreador)

  if (editando) {
    return (
      <RequerimientoEditForm
        requerimiento={r}
        proyectos={proyectos}
        canChangeObra={canChangeObra}
        mode={editMode}
        onCancel={() => setEditando(false)}
        onSaved={() => setEditando(false)}
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ítems solicitados ({r.items.length})
        </h2>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditando(true)}
            className={role === 'admin_ti' && r.estado === 'aprobado'
              ? 'border-amber-500/40 text-amber-800 hover:bg-amber-500/10'
              : 'border-border text-foreground hover:bg-muted/50'}
          >
            {role === 'admin_ti' && r.estado === 'aprobado' ? (
              <>
                <ShieldAlert className="size-4" />
                Editar requerimiento aprobado
              </>
            ) : (
              <>
                <Pencil className="size-3.5" />
                Editar requerimiento
              </>
            )}
          </Button>
        )}
      </div>
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
