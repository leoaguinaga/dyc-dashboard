import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import type { ObraHoy, ObrasHoyResponse } from '@/types/api'

export type EstadoObra = 'en_curso' | 'sin_abrir' | 'cerrada' | 'sin_horario'

export const ORDEN_ESTADO: Record<EstadoObra, number> = { en_curso: 0, sin_abrir: 1, cerrada: 2, sin_horario: 3 }

export function estadoDe(obra: ObraHoy): EstadoObra {
  if (obra.turnos.some((t) => t.estado === 'abierto')) return 'en_curso'
  if (obra.turnos.length > 0) return 'cerrada'
  if (obra.horarios.length === 0) return 'sin_horario'
  return 'sin_abrir'
}

export interface AccionObra {
  label: string
  href?: string
  // true = abrir el turno de inmediato (obra con un solo horario) y entrar a él
  abrir?: boolean
}

interface Contexto {
  esPdr: boolean
  puedeConfigurar: boolean
}

// Un solo criterio para lo que se puede hacer con una obra hoy, compartido por las
// tarjetas y por el selector "Marcar asistencia".
export function accionDe(obra: ObraHoy, estado: EstadoObra, ctx: Contexto): AccionObra | null {
  const turnoHref = `/asistencia/turno/${obra.proyectoId}`
  if (estado === 'en_curso' && obra.puedeOperar) return { label: 'Continuar turno', href: turnoHref }
  if (estado === 'cerrada') {
    // El prevencionista no tiene acceso al detalle de jornada y consulta desde su pantalla.
    return { label: 'Ver jornada', href: ctx.esPdr ? turnoHref : `/asistencia/${obra.turnos[0]?.id}` }
  }
  if (estado === 'sin_abrir' && obra.puedeOperar) {
    return obra.horarios.length === 1 ? { label: 'Abrir turno', abrir: true } : { label: 'Abrir turno', href: turnoHref }
  }
  if (estado === 'sin_horario' && ctx.puedeConfigurar) {
    return { label: 'Configurar horario', href: `/proyectos/${obra.proyectoId}/editar` }
  }
  return null
}

export function detalleObra(obra: ObraHoy, estado: EstadoObra): string | null {
  const totalObreros = obra.turnos.reduce((s, t) => s + t.obreros, 0)
  if (estado === 'en_curso' || estado === 'cerrada') {
    return `${totalObreros} ${totalObreros === 1 ? 'obrero' : 'obreros'}${obra.turnos.length > 1 ? ` · ${obra.turnos.length} turnos` : ''}`
  }
  if (estado === 'sin_abrir') {
    return obra.horarios.length === 1 ? `Turno ${obra.horarios[0].nombre}` : `${obra.horarios.length} turnos disponibles`
  }
  return null
}

export async function abrirTurnoDeObra(obra: ObraHoy) {
  await api.post(`/asistencias/proyectos/${obra.proyectoId}/turnos`, { turnoConfigId: obra.horarios[0].id })
}

export function useObrasHoy() {
  const [data, setData] = useState<ObrasHoyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const res = await api.get<ObrasHoyResponse>('/asistencias/hoy')
        if (!cancelado) setData(res)
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar las obras de hoy')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void cargar()
    return () => {
      cancelado = true
    }
  }, [])

  return { data, loading, error }
}
