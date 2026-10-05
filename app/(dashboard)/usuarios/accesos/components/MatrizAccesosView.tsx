'use client'

import { useState } from 'react'
import { api } from '@/lib/api/client'
import { ROLE_LABELS } from '@/lib/roles'
import { NivelAccesoSelect } from '@/components/accesos/NivelAccesoSelect'
import type { MatrizAccesos, ModuloKey, NivelAcceso, Role } from '@/types/api'

interface Props {
  initial: MatrizAccesos
  editable: boolean
}

export function MatrizAccesosView({ initial, editable }: Props) {
  const [matriz, setMatriz] = useState(initial)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const celda = (modulo: ModuloKey, role: Role) =>
    matriz.celdas.find((c) => c.modulo === modulo && c.role === role)!

  const excepciones = matriz.celdas.filter((c) => c.excepcion !== null).length

  async function cambiar(modulo: ModuloKey, role: Role, nivel: NivelAcceso | null) {
    const clave = `${modulo}:${role}`
    const anterior = matriz
    // Se muestra el cambio al instante; si el servidor lo rechaza, se revierte.
    setMatriz({
      ...matriz,
      celdas: matriz.celdas.map((c) =>
        c.modulo === modulo && c.role === role ? { ...c, excepcion: nivel } : c,
      ),
    })
    setGuardando(clave)
    setError(null)
    try {
      setMatriz(await api.put<MatrizAccesos>(`/rbac/modulos/${modulo}/roles/${role}`, { nivel }))
    } catch (err) {
      setMatriz(anterior)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          {excepciones === 0
            ? 'Sin excepciones: todos los roles usan el acceso que define el sistema.'
            : `${excepciones} ${excepciones === 1 ? 'excepción configurada' : 'excepciones configuradas'}.`}
        </p>
        {!editable && (
          <p className="text-xs text-muted-foreground">Solo el área de TI puede cambiar estos accesos.</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="relative w-full max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-border bg-white">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-muted px-3 py-2.5 text-left font-medium">Módulo</th>
              {matriz.roles.map((role) => (
                <th key={role} className="px-2 py-2.5 text-left text-xs font-medium whitespace-nowrap">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matriz.modulos.map((m) => (
              <tr key={m.key}>
                <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium whitespace-nowrap">
                  {m.label}
                </th>
                {matriz.roles.map((role) => {
                  const c = celda(m.key, role)
                  return (
                    <td key={role} className="px-2 py-2">
                      <NivelAccesoSelect
                        heredado={c.porDefecto}
                        heredadoLabel="Sistema"
                        valor={c.excepcion}
                        onChange={(nivel) => cambiar(m.key, role, nivel)}
                        disabled={!editable || guardando === `${m.key}:${role}`}
                        ariaLabel={`${m.label} para ${ROLE_LABELS[role]}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-1 text-xs text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Sistema</span>: el acceso que trae cada rol hoy.
          &quot;Parcial&quot; significa que el rol solo usa algunas acciones del módulo.
        </li>
        <li>
          <span className="font-medium text-foreground">Ver</span> permite consultar;{' '}
          <span className="font-medium text-foreground">Editar</span> permite además crear, modificar y aprobar en
          todo el módulo. Las reglas propias de cada flujo (quién aprueba qué tipo de requerimiento, por ejemplo)
          se siguen aplicando.
        </li>
        <li>
          <span className="font-medium text-foreground">Sin acceso</span> oculta el módulo y bloquea sus consultas,
          incluidas las que otras pantallas hacen a ese módulo (por ejemplo, la lista de obras en un formulario).
        </li>
        <li>Admin TI siempre tiene acceso total. Los cambios se aplican en menos de un minuto; el menú se actualiza al recargar.</li>
      </ul>
    </div>
  )
}
