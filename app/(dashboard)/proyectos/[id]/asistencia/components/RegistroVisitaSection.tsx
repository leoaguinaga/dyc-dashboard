'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogInIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TrabajadorCombobox } from '@/components/ui/trabajador-combobox'
import type { RegistroVisita, Trabajador, TipoVisita } from '@/types/api'

interface Props {
  proyectoId: string
  tipo: TipoVisita
  registros: RegistroVisita[]
  trabajadoresDisponibles: Trabajador[]
}

const COPY: Record<TipoVisita, { titulo: string; ayuda: string; placeholderTrabajador: string }> = {
  staff: {
    titulo: 'Staff en obra',
    ayuda: 'Supervisores, coordinadores u otro personal asignado a la obra (no operarios). Marcar salida es opcional.',
    placeholderTrabajador: 'Seleccionar trabajador asignado a la obra…',
  },
  staff_oficina: {
    titulo: 'Staff de oficina',
    ayuda: 'Ingenieros, gerencia o back office que visitan la obra. Requiere motivo de la visita.',
    placeholderTrabajador: 'Buscar trabajador (opcional)…',
  },
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function RegistroVisitaSection({ proyectoId, tipo, registros, trabajadoresDisponibles }: Props) {
  const router = useRouter()
  const copy = COPY[tipo]

  const [trabajadorId, setTrabajadorId] = useState('')
  const [nombreLibre, setNombreLibre] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salidaLoadingId, setSalidaLoadingId] = useState<string | null>(null)

  const sinIdentidad = tipo === 'staff_oficina' && !trabajadorId && !nombreLibre.trim()

  async function registrarEntrada() {
    setError(null)
    if (tipo === 'staff' && !trabajadorId) {
      setError('Selecciona un trabajador asignado a la obra')
      return
    }
    if (tipo === 'staff_oficina') {
      if (sinIdentidad) {
        setError('Indica el trabajador o escribe un nombre')
        return
      }
      if (!motivo.trim()) {
        setError('El motivo de la visita es obligatorio')
        return
      }
    }

    setLoading(true)
    try {
      await api.post(`/asistencias/proyectos/${proyectoId}/visitas`, {
        tipo,
        trabajadorId: trabajadorId || undefined,
        nombreLibre: tipo === 'staff_oficina' && !trabajadorId ? nombreLibre.trim() : undefined,
        motivo: tipo === 'staff_oficina' ? motivo.trim() : undefined,
      })
      setTrabajadorId('')
      setNombreLibre('')
      setMotivo('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el ingreso')
    } finally {
      setLoading(false)
    }
  }

  async function marcarSalida(registroId: string) {
    setSalidaLoadingId(registroId)
    setError(null)
    try {
      await api.patch(`/asistencias/proyectos/${proyectoId}/visitas/${registroId}/salida`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la salida')
    } finally {
      setSalidaLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-white p-5">
        <div>
          <p className="text-sm font-medium">{copy.titulo}</p>
          <p className="text-xs text-muted-foreground">{copy.ayuda}</p>
        </div>

        {tipo === 'staff' ? (
          <TrabajadorCombobox
            trabajadores={trabajadoresDisponibles}
            value={trabajadorId}
            onValueChange={setTrabajadorId}
            placeholder={copy.placeholderTrabajador}
          />
        ) : (
          <div className="space-y-2">
            <TrabajadorCombobox
              trabajadores={trabajadoresDisponibles}
              value={trabajadorId}
              onValueChange={(v) => {
                setTrabajadorId(v)
                if (v) setNombreLibre('')
              }}
              placeholder={copy.placeholderTrabajador}
            />
            {!trabajadorId && (
              <Input
                value={nombreLibre}
                onChange={(e) => setNombreLibre(e.target.value)}
                placeholder="…o escribe el nombre si no está en el sistema"
              />
            )}
          </div>
        )}

        {tipo === 'staff_oficina' && (
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de la visita (obligatorio)"
            className="min-h-[70px]"
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="button" onClick={registrarEntrada} disabled={loading} className="w-full gap-1.5">
          <LogInIcon className="size-4" />
          {loading ? 'Registrando...' : 'Registrar ingreso'}
        </Button>
      </div>

      <div className="space-y-2">
        {registros.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Sin ingresos registrados hoy.
          </p>
        ) : (
          registros.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-white p-4">
              <div className="flex min-w-0 items-center gap-2">
                <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {r.trabajador?.nombre ?? r.user?.name ?? r.nombreLibre ?? 'Sin identificar'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.trabajador?.cargo ?? ''}
                    {r.motivo && (r.trabajador?.cargo ? ' — ' : '') + r.motivo}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatHora(r.horaEntrada)}
                  {r.horaSalida && <> – {formatHora(r.horaSalida)}</>}
                </span>
                {!r.horaSalida && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => marcarSalida(r.id)}
                    disabled={salidaLoadingId === r.id}
                    className="gap-1"
                  >
                    <LogOutIcon className="size-3.5" />
                    Salida
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
