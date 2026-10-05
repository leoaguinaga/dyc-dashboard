'use client'

import { useState } from 'react'
import { api } from '@/lib/api/client'
import { NivelAccesoSelect } from '@/components/accesos/NivelAccesoSelect'
import type { AccesosUsuario, ModuloKey, NivelAcceso } from '@/types/api'

interface Props {
  initial: AccesosUsuario
  editable: boolean
}

/** Excepciones de acceso por módulo para una persona, por encima de las de su rol. */
export function AccesosUsuarioSection({ initial, editable }: Props) {
  const [accesos, setAccesos] = useState(initial)
  const [guardando, setGuardando] = useState<ModuloKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (accesos.accesoTotal) {
    return <p className="text-sm text-muted-foreground">Admin TI tiene acceso total a todos los módulos.</p>
  }

  async function cambiar(modulo: ModuloKey, nivel: NivelAcceso | null) {
    const anterior = accesos
    // Se muestra el cambio al instante; si el servidor lo rechaza, se revierte.
    setAccesos({
      ...accesos,
      modulos: accesos.modulos.map((m) => (m.modulo === modulo ? { ...m, excepcion: nivel } : m)),
    })
    setGuardando(modulo)
    setError(null)
    try {
      setAccesos(
        await api.put<AccesosUsuario>(`/rbac/modulos/${modulo}/usuarios/${accesos.userId}`, { nivel }),
      )
    } catch (err) {
      setAccesos(anterior)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="space-y-3">
      {!editable && (
        <p className="text-xs text-muted-foreground">Solo el área de TI puede cambiar estos accesos.</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="divide-y divide-border rounded-lg border border-border">
        {accesos.modulos.map((m) => (
          <div key={m.modulo} className="flex flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">{m.label}</span>
            <NivelAccesoSelect
              heredado={m.segunRol}
              heredadoLabel="Según rol"
              valor={m.excepcion}
              onChange={(nivel) => cambiar(m.modulo, nivel)}
              disabled={!editable || guardando === m.modulo}
              ariaLabel={`Acceso a ${m.label}`}
              className="sm:w-56"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
