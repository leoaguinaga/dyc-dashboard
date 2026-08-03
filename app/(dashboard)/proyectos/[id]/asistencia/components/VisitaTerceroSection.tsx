'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogInIcon, LogOutIcon, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { VisitaTercero } from '@/types/api'

interface Props {
  proyectoId: string
  visitas: VisitaTercero[]
}

type VisitanteForm = { nombre: string; dni: string }

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function VisitaTerceroSection({ proyectoId, visitas }: Props) {
  const router = useRouter()

  const [empresaNombre, setEmpresaNombre] = useState('')
  const [motivo, setMotivo] = useState('')
  const [personas, setPersonas] = useState<VisitanteForm[]>([{ nombre: '', dni: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salidaLoadingId, setSalidaLoadingId] = useState<string | null>(null)

  function updatePersona(index: number, key: keyof VisitanteForm, value: string) {
    setPersonas((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)))
  }

  function agregarPersona() {
    setPersonas((prev) => [...prev, { nombre: '', dni: '' }])
  }

  function quitarPersona(index: number) {
    setPersonas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function registrar() {
    setError(null)
    if (!empresaNombre.trim()) {
      setError('Indica la empresa o razón social')
      return
    }
    if (!motivo.trim()) {
      setError('Indica el motivo de la visita')
      return
    }
    const validas = personas.filter((p) => p.nombre.trim() && p.dni.trim())
    if (validas.length === 0) {
      setError('Agrega al menos una persona con nombre y DNI')
      return
    }

    setLoading(true)
    try {
      await api.post(`/asistencias/proyectos/${proyectoId}/terceros`, {
        empresaNombre: empresaNombre.trim(),
        motivo: motivo.trim(),
        visitantes: validas.map((p) => ({ nombre: p.nombre.trim(), dni: p.dni.trim() })),
      })
      setEmpresaNombre('')
      setMotivo('')
      setPersonas([{ nombre: '', dni: '' }])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la visita')
    } finally {
      setLoading(false)
    }
  }

  async function marcarSalida(visitaId: string, visitanteId: string) {
    setSalidaLoadingId(visitanteId)
    setError(null)
    try {
      await api.patch(
        `/asistencias/proyectos/${proyectoId}/terceros/${visitaId}/visitantes/${visitanteId}/salida`,
        {},
      )
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
          <p className="text-sm font-medium">Registrar visita de terceros</p>
          <p className="text-xs text-muted-foreground">
            Contratistas externos (HVAC, pintura, etc.). Registro libre, sin vincularse a una OC previa.
          </p>
        </div>

        <Input
          value={empresaNombre}
          onChange={(e) => setEmpresaNombre(e.target.value)}
          placeholder="Empresa / razón social"
        />
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la visita"
          className="min-h-[60px]"
        />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Personas que ingresan</p>
          {personas.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={p.nombre}
                onChange={(e) => updatePersona(i, 'nombre', e.target.value)}
                placeholder="Nombre completo"
                className="flex-1"
              />
              <Input
                value={p.dni}
                onChange={(e) => updatePersona(i, 'dni', e.target.value)}
                placeholder="DNI"
                className="w-28"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => quitarPersona(i)}
                disabled={personas.length === 1}
                className="shrink-0"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={agregarPersona} className="gap-1.5">
            <PlusIcon className="size-3.5" />
            Agregar persona
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="button" onClick={registrar} disabled={loading} className="w-full gap-1.5">
          <LogInIcon className="size-4" />
          {loading ? 'Registrando...' : 'Registrar visita'}
        </Button>
      </div>

      <div className="space-y-3">
        {visitas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Sin visitas de terceros registradas hoy.
          </p>
        ) : (
          visitas.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{v.empresaNombre}</p>
                    <p className="text-xs text-muted-foreground">{v.motivo}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {v.visitantes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">DNI {p.dni}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatHora(p.horaEntrada)}
                        {p.horaSalida && <> – {formatHora(p.horaSalida)}</>}
                      </span>
                      {!p.horaSalida && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => marcarSalida(v.id, p.id)}
                          disabled={salidaLoadingId === p.id}
                          className="gap-1"
                        >
                          <LogOutIcon className="size-3.5" />
                          Salida
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
