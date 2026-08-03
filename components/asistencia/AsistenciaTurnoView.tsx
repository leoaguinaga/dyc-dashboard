'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraIcon, CheckCircle2Icon, ClockIcon, ImageOffIcon, LogOutIcon, RotateCcwIcon } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CierrePreview, EstadoAsistencia, Proyecto, Turno, TurnoDetalle } from '@/types/api'

interface Props {
  proyecto: Proyecto
  turnoInicial: TurnoDetalle | null
}

const ESTADO_LABEL: Record<EstadoAsistencia, string> = {
  presente: 'Presente',
  tardio: 'Tardío',
  falta: 'Falta',
}

const ESTADO_BADGE: Record<EstadoAsistencia, string> = {
  presente: 'bg-chart-2/15 text-chart-2',
  tardio: 'bg-amber-500/15 text-amber-600',
  falta: 'bg-destructive/15 text-destructive',
}

const MOTIVOS_FOTO_OMITIDA = [
  'Celular sin batería',
  'Sin señal o datos móviles',
  'Celular dañado o perdido',
  'Cámara malograda',
  'Obreros dispersos en varios frentes',
]

const MOTIVOS_JUSTIFICACION = [
  'Problema de transporte',
  'Emergencia familiar',
  'Cita médica / control de salud',
  'Permiso autorizado previamente',
  'Trámite personal urgente',
  'Clima / vía bloqueada',
]

const MOTIVOS_SALIDA_TEMPRANA = [
  'Accidente de trabajo',
  'Emergencia familiar',
  'Cita médica / control de salud',
  'Malestar de salud súbito',
  'Permiso personal autorizado',
  'Trámite urgente',
  'Otro',
]

function toggleMotivoTag(motivo: string, tag: string): string {
  const partes = motivo.split(';').map((s) => s.trim()).filter(Boolean)
  const yaEsta = partes.includes(tag)
  const nuevas = yaEsta ? partes.filter((p) => p !== tag) : [...partes, tag]
  return nuevas.join('; ')
}

function MotivoTags({ motivos, value, onChange }: { motivos: string[]; value: string; onChange: (v: string) => void }) {
  const seleccionados = value.split(';').map((s) => s.trim())
  return (
    <div className="flex flex-wrap gap-1.5">
      {motivos.map((tag) => {
        const activo = seleccionados.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(toggleMotivoTag(value, tag))}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-[120ms] ${
              activo
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}

export function AsistenciaTurnoView({ proyecto, turnoInicial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!proyecto.jornadaInicio || !proyecto.jornadaFin) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700">
        Esta obra no tiene configurada la jornada de asistencia (hora de inicio/fin).{' '}
        <a href={`/proyectos/${proyecto.id}/editar`} className="underline underline-offset-2">
          Configúrala en Editar proyecto
        </a>{' '}
        antes de tomar asistencia.
      </div>
    )
  }

  if (!turnoInicial) {
    async function abrirTurno() {
      setLoading(true)
      setError(null)
      try {
        await api.post(`/asistencias/proyectos/${proyecto.id}/turnos`, {})
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al abrir el turno')
        setLoading(false)
      }
    }

    return (
      <div className="space-y-3 rounded-xl border border-border bg-white p-6 text-center">
        <p className="text-sm text-muted-foreground">Todavía no se ha abierto el turno de hoy para esta obra.</p>
        <Button onClick={abrirTurno} disabled={loading}>
          {loading ? 'Abriendo...' : 'Abrir turno'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  if (turnoInicial.estado === 'cerrado') {
    return <TurnoCerradoResumen proyectoId={proyecto.id} turno={turnoInicial} />
  }

  const evidenciaResuelta = !!turnoInicial.fotoUrl || turnoInicial.fotoOmitida
  const presenciaRegistrada = turnoInicial.obreros.every((o) => o.asistencia !== null)

  if (!evidenciaResuelta || !presenciaRegistrada) {
    return <EvidenciaYPresenciaGate proyectoId={proyecto.id} turno={turnoInicial} />
  }

  return <TurnoAbiertoForm proyectoId={proyecto.id} turno={turnoInicial} />
}

function EvidenciaYPresenciaGate({ proyectoId, turno }: { proyectoId: string; turno: TurnoDetalle }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modo, setModo] = useState<'subir' | 'omitir'>('subir')
  const [file, setFile] = useState<File | null>(null)
  const [motivo, setMotivo] = useState('')
  const [presentes, setPresentes] = useState<Record<string, boolean>>(
    Object.fromEntries(turno.obreros.map((o) => [o.trabajadorId, true])),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  async function guardarYContinuar() {
    if (modo === 'subir' && !file) {
      setError('Selecciona una foto')
      return
    }
    if (modo === 'omitir' && motivo.trim().length < 5) {
      setError('Escribe un motivo (mínimo 5 caracteres)')
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (modo === 'subir' && file) {
        const formData = new FormData()
        formData.append('foto', file)
        await api.upload<Turno>(`/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/foto`, formData)
      } else {
        await api.patch(`/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/omitir-foto`, { motivo: motivo.trim() })
      }

      await api.patch(`/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/asistencias`, {
        asistencias: turno.obreros.map((o) => ({
          trabajadorId: o.trabajadorId,
          estado: presentes[o.trabajadorId] ? 'presente' : 'falta',
        })),
      })

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2">
          <ClockIcon className="size-3" /> Turno abierto
        </span>
        <span className="text-xs text-muted-foreground">
          desde {new Date(turno.horaAperturaReal).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-white p-5">
        <div>
          <p className="text-sm font-medium">Evidencia de apertura</p>
          <p className="text-xs text-muted-foreground">
            Sube la foto grupal. Si no es posible, puedes omitirla justificando el motivo.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant={modo === 'subir' ? 'default' : 'outline'} size="sm" onClick={() => setModo('subir')}>
            Subir foto
          </Button>
          <Button type="button" variant={modo === 'omitir' ? 'default' : 'outline'} size="sm" onClick={() => setModo('omitir')}>
            Omitir con motivo
          </Button>
        </div>

        {modo === 'subir' ? (
          <div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full gap-1.5">
              <CameraIcon className="size-4" />
              {file ? file.name : 'Seleccionar foto grupal'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <MotivoTags motivos={MOTIVOS_FOTO_OMITIDA} value={motivo} onChange={setMotivo} />
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Selecciona un motivo o escribe el tuyo..."
              className="min-h-[80px]"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-white p-5">
        <div>
          <p className="text-sm font-medium">Asistencia inicial</p>
          <p className="text-xs text-muted-foreground">Todos parten como presentes — apaga a quien no esté.</p>
        </div>
        <div className="space-y-2">
          {turno.obreros.map((o) => (
            <label key={o.trabajadorId} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{o.nombre}</p>
                {o.cargo && <p className="text-xs text-muted-foreground">{o.cargo}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${presentes[o.trabajadorId] ? 'text-chart-2' : 'text-destructive'}`}>
                  {presentes[o.trabajadorId] ? 'Presente' : 'Ausente'}
                </span>
                <Switch
                  checked={presentes[o.trabajadorId]}
                  onCheckedChange={(v) => setPresentes((prev) => ({ ...prev, [o.trabajadorId]: v }))}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" onClick={guardarYContinuar} disabled={loading} className="w-full">
        {loading ? 'Guardando...' : 'Guardar y continuar'}
      </Button>
    </div>
  )
}

type RowState = {
  trabajadorId: string
  nombre: string
  cargo?: string
  estado: EstadoAsistencia
  horaLlegadaReal: string
  justificada: boolean
  justificacion: string
  salidaTempranaHora: string
  salidaTempranaMotivo: string
}

function filaInicial(obrero: TurnoDetalle['obreros'][number]): RowState {
  return {
    trabajadorId: obrero.trabajadorId,
    nombre: obrero.nombre,
    cargo: obrero.cargo,
    estado: obrero.asistencia?.estado ?? 'falta',
    horaLlegadaReal: obrero.asistencia?.horaLlegadaReal ?? '',
    justificada: obrero.asistencia?.justificada ?? false,
    justificacion: obrero.asistencia?.justificacion ?? '',
    salidaTempranaHora: obrero.asistencia?.salidaTempranaHora ?? '',
    salidaTempranaMotivo: obrero.asistencia?.salidaTempranaMotivo ?? '',
  }
}

function TurnoAbiertoForm({ proyectoId, turno }: { proyectoId: string; turno: TurnoDetalle }) {
  const router = useRouter()
  const [rows, setRows] = useState<RowState[]>(turno.obreros.map(filaInicial))
  const [salidaAbiertaPara, setSalidaAbiertaPara] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [preview, setPreview] = useState<CierrePreview | null>(null)
  const [confirmandoExtra, setConfirmandoExtra] = useState(false)

  function updateRow<K extends keyof RowState>(trabajadorId: string, key: K, value: RowState[K]) {
    setRows((prev) => prev.map((r) => (r.trabajadorId === trabajadorId ? { ...r, [key]: value } : r)))
    setGuardadoOk(false)
  }

  function validar(): string | null {
    for (const r of rows) {
      if (r.estado === 'tardio' && !r.horaLlegadaReal) {
        return `Falta la hora de llegada de ${r.nombre}`
      }
      if (r.justificada && r.estado !== 'presente' && !r.justificacion.trim()) {
        return `Falta el motivo de la justificación de ${r.nombre}`
      }
      if (r.salidaTempranaHora && !r.salidaTempranaMotivo.trim()) {
        return `Falta el motivo de la salida temprana de ${r.nombre}`
      }
    }
    return null
  }

  async function guardarAsistencia(): Promise<boolean> {
    const err = validar()
    if (err) {
      setError(err)
      return false
    }
    setGuardando(true)
    setError(null)
    try {
      await api.patch(`/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/asistencias`, {
        asistencias: rows.map((r) => ({
          trabajadorId: r.trabajadorId,
          estado: r.estado,
          horaLlegadaReal: r.estado === 'tardio' ? r.horaLlegadaReal : null,
          justificada: r.estado !== 'presente' ? r.justificada : null,
          justificacion: r.estado !== 'presente' && r.justificada ? r.justificacion : null,
          salidaTempranaHora: r.salidaTempranaHora || null,
          salidaTempranaMotivo: r.salidaTempranaHora ? r.salidaTempranaMotivo : null,
        })),
      })
      setGuardadoOk(true)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la asistencia')
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function iniciarCierre() {
    setError(null)
    const guardadoExitoso = await guardarAsistencia()
    if (!guardadoExitoso) return

    setCerrando(true)
    try {
      const cierrePreview = await api.get<CierrePreview>(
        `/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/cierre-preview`,
      )
      if (cierrePreview.hayExcedente) {
        setPreview(cierrePreview)
        setConfirmandoExtra(true)
        setCerrando(false)
        return
      }
      await confirmarCierre(undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cerrar el turno')
      setCerrando(false)
    }
  }

  async function confirmarCierre(pagarExtra: boolean | undefined) {
    setCerrando(true)
    setError(null)
    try {
      await api.patch(`/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/cerrar`, { pagarExtra })
      setConfirmandoExtra(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cerrar el turno')
      setCerrando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2">
            <ClockIcon className="size-3" /> Turno abierto
          </span>
          <span className="text-xs text-muted-foreground">
            desde {new Date(turno.horaAperturaReal).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Jornada {turno.proyecto.jornadaInicio}–{turno.proyecto.jornadaFin}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.trabajadorId} className="space-y-3 rounded-xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{row.nombre}</p>
                {row.cargo && <p className="text-xs text-muted-foreground">{row.cargo}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                {row.estado !== 'presente' && (
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${row.justificada ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                    {row.justificada ? 'Justificada' : 'Injustificada'}
                  </span>
                )}
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[row.estado]}`}>
                  {ESTADO_LABEL[row.estado]}
                </span>
              </div>
            </div>

            {row.estado === 'presente' ? (
              <SalidaTempranaControl row={row} onChange={updateRow} abierto={salidaAbiertaPara === row.trabajadorId} onToggleAbierto={(v) => setSalidaAbiertaPara(v ? row.trabajadorId : null)} />
            ) : (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-sm">¿Llegó tarde?</span>
                  <Switch
                    checked={row.estado === 'tardio'}
                    onCheckedChange={(v) => updateRow(row.trabajadorId, 'estado', v ? 'tardio' : 'falta')}
                  />
                </label>

                {row.estado === 'tardio' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Hora de llegada</label>
                    <TimePicker
                      value={row.horaLlegadaReal}
                      onValueChange={(v) => updateRow(row.trabajadorId, 'horaLlegadaReal', v)}
                    />
                  </div>
                )}

                <label className="flex items-center justify-between gap-2">
                  <span className="text-sm">Justificada</span>
                  <Switch
                    checked={row.justificada}
                    onCheckedChange={(v) => updateRow(row.trabajadorId, 'justificada', v)}
                  />
                </label>

                {row.justificada && (
                  <div className="space-y-2">
                    <label className="mb-1.5 block text-sm font-medium">Motivo</label>
                    <MotivoTags
                      motivos={MOTIVOS_JUSTIFICACION}
                      value={row.justificacion}
                      onChange={(v) => updateRow(row.trabajadorId, 'justificacion', v)}
                    />
                    <Textarea
                      value={row.justificacion}
                      onChange={(e) => updateRow(row.trabajadorId, 'justificacion', e.target.value)}
                      placeholder="Selecciona un motivo o escribe el tuyo..."
                      className="min-h-[70px]"
                    />
                  </div>
                )}

                {row.estado === 'tardio' && (
                  <SalidaTempranaControl row={row} onChange={updateRow} abierto={salidaAbiertaPara === row.trabajadorId} onToggleAbierto={(v) => setSalidaAbiertaPara(v ? row.trabajadorId : null)} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {guardadoOk && !error && (
        <p className="flex items-center gap-1.5 text-sm text-chart-2">
          <CheckCircle2Icon className="size-4" /> Asistencia guardada
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={guardarAsistencia} disabled={guardando || cerrando}>
          {guardando ? 'Guardando...' : 'Guardar asistencia'}
        </Button>
        <Button type="button" onClick={iniciarCierre} disabled={guardando || cerrando}>
          {cerrando ? 'Cerrando...' : 'Cerrar turno'}
        </Button>
      </div>

      <Dialog open={confirmandoExtra} onOpenChange={(open) => !open && setConfirmandoExtra(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Se adjudicará pago de hora extra?</DialogTitle>
            <DialogDescription>
              {preview && (
                <>
                  Se detectaron {preview.totalHorasExtra.toFixed(1)}h de horas extra (por encima de la tolerancia de{' '}
                  {turno.proyecto.toleranciaSalidaMinutos ?? 60} min) para: {preview.trabajadoresAfectados.map((t) => t.nombre).join(', ')}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => confirmarCierre(false)} disabled={cerrando}>
              No pagar
            </Button>
            <Button onClick={() => confirmarCierre(true)} disabled={cerrando}>
              {cerrando ? 'Cerrando...' : 'Sí, pagar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SalidaTempranaControl({
  row,
  onChange,
  abierto,
  onToggleAbierto,
}: {
  row: RowState
  onChange: <K extends keyof RowState>(trabajadorId: string, key: K, value: RowState[K]) => void
  abierto: boolean
  onToggleAbierto: (v: boolean) => void
}) {
  const tieneSalidaTemprana = !!row.salidaTempranaHora

  if (!tieneSalidaTemprana && !abierto) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => onToggleAbierto(true)} className="gap-1.5">
        <LogOutIcon className="size-3.5" />
        Marcar salida temprana
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Salida temprana</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(row.trabajadorId, 'salidaTempranaHora', '')
            onChange(row.trabajadorId, 'salidaTempranaMotivo', '')
            onToggleAbierto(false)
          }}
        >
          Quitar
        </Button>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Hora de salida</label>
        <TimePicker
          value={row.salidaTempranaHora}
          onValueChange={(v) => onChange(row.trabajadorId, 'salidaTempranaHora', v)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Motivo</label>
        <Select
          value={MOTIVOS_SALIDA_TEMPRANA.includes(row.salidaTempranaMotivo) ? row.salidaTempranaMotivo : row.salidaTempranaMotivo ? 'Otro' : ''}
          onValueChange={(v) => onChange(row.trabajadorId, 'salidaTempranaMotivo', v === 'Otro' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un motivo..." />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS_SALIDA_TEMPRANA.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(!MOTIVOS_SALIDA_TEMPRANA.includes(row.salidaTempranaMotivo) || row.salidaTempranaMotivo === '') && (
          <Textarea
            value={row.salidaTempranaMotivo}
            onChange={(e) => onChange(row.trabajadorId, 'salidaTempranaMotivo', e.target.value)}
            placeholder="Detalle el motivo..."
            className="mt-2 min-h-[60px]"
          />
        )}
      </div>
    </div>
  )
}

function TurnoCerradoResumen({ proyectoId, turno }: { proyectoId: string; turno: TurnoDetalle }) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role
  const puedeReabrir = role === 'administrador' || role === 'gerencia'

  const [confirmando, setConfirmando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalNormales = turno.asistencias.reduce((s, a) => s + Number(a.horasNormales), 0)
  const totalExtra = turno.asistencias.reduce((s, a) => s + Number(a.horasExtra), 0)

  async function reabrirTurno() {
    if (motivo.trim().length < 5) {
      setError('Escribe un motivo (mínimo 5 caracteres)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.patch(`/asistencias/proyectos/${proyectoId}/turnos/${turno.id}/reabrir`, { motivo: motivo.trim() })
      setConfirmando(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reabrir el turno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <CheckCircle2Icon className="size-3" /> Turno cerrado
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {turno.horaCierreReal && new Date(turno.horaCierreReal).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            {turno.cerradoPor && ` · por ${turno.cerradoPor.name}`}
          </span>
          {puedeReabrir && (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmando(true)} className="gap-1.5">
              <RotateCcwIcon className="size-3.5" />
              Reabrir turno
            </Button>
          )}
        </div>
      </div>

      {turno.corregidoEn && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
          Reabierto por {turno.corregidoPor?.name ?? 'un administrador'} el{' '}
          {new Date(turno.corregidoEn).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          {turno.motivoCorreccion && <> — {turno.motivoCorreccion}</>}
        </div>
      )}

      {turno.fotoUrl ? (
        <img src={`${API_ORIGIN}${turno.fotoUrl}`} alt="Evidencia del turno" className="max-h-56 w-full rounded-xl border border-border object-cover" />
      ) : turno.fotoOmitida ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <ImageOffIcon className="size-4 shrink-0" />
          <span>Evidencia fotográfica omitida{turno.motivoFotoOmitida && <> — {turno.motivoFotoOmitida}</>}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Horas normales</p>
          <p className="text-xl font-semibold tabular-nums">{totalNormales.toFixed(1)}h</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Horas extra</p>
          <p className="text-xl font-semibold tabular-nums">{totalExtra.toFixed(1)}h</p>
        </div>
      </div>

      <div className="space-y-2">
        {turno.obreros.map((o) => (
          <div key={o.trabajadorId} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-white p-4">
            <div>
              <p className="text-sm font-medium">{o.nombre}</p>
              <p className="text-xs text-muted-foreground">{o.cargo}</p>
              {o.asistencia?.salidaTempranaHora && (
                <p className="mt-1 text-xs text-amber-600">
                  Salida temprana {o.asistencia.salidaTempranaHora}
                  {o.asistencia.salidaTempranaMotivo && ` — ${o.asistencia.salidaTempranaMotivo}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {o.asistencia && o.asistencia.estado !== 'presente' && (
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${o.asistencia.justificada ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                    {o.asistencia.justificada ? 'Justificada' : 'Injustificada'}
                  </span>
                )}
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[o.asistencia?.estado ?? 'falta']}`}>
                  {ESTADO_LABEL[o.asistencia?.estado ?? 'falta']}
                </span>
              </div>
              {o.asistencia && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {Number(o.asistencia.horasNormales).toFixed(1)}h
                  {Number(o.asistencia.horasExtra) > 0 && ` + ${Number(o.asistencia.horasExtra).toFixed(1)}h extra${o.asistencia.pagarExtra ? '' : ' (sin pagar)'}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={confirmando} onOpenChange={(open) => !open && setConfirmando(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir turno</DialogTitle>
            <DialogDescription>
              El turno volverá a estado abierto para corregir la asistencia. Indica el motivo — queda registrado en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de la corrección..."
            className="min-h-[80px]"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmando(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={reabrirTurno} disabled={loading}>
              {loading ? 'Reabriendo...' : 'Reabrir turno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
