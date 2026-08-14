'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDownIcon, LockIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Planilla, Proyecto } from '@/types/api'

interface Props {
  proyectos: Proyecto[]
}

// Planilla.periodoInicio/periodoFin son solo-fecha (medianoche UTC = marcador
// de día calendario) — leer directo el ISO, no convertir por timezone.
function formatFecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// generadaEn sí es un instante real — aquí corresponde convertir a hora Lima.
function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' })
}

function formatMonto(n: number) {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })
}

export function PlanillasGlobalView({ proyectos }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'

  const [rango, setRango] = useState<DateRangeValue>({})
  const [proyectoId, setProyectoId] = useState('todos')
  const [planillas, setPlanillas] = useState<Planilla[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [expandidaId, setExpandidaId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<Record<string, Planilla>>({})

  useEffect(() => {
    if (!autorizado) return
    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (rango.desde) params.set('desde', rango.desde)
        if (rango.hasta) params.set('hasta', rango.hasta)
        if (proyectoId !== 'todos') params.set('proyectoId', proyectoId)
        const data = await api.get<Planilla[]>(`/asistencias/planillas?${params.toString()}`)
        setPlanillas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las planillas')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [autorizado, rango.desde, rango.hasta, proyectoId])

  async function toggleExpandir(p: Planilla) {
    if (expandidaId === p.id) {
      setExpandidaId(null)
      return
    }
    setExpandidaId(p.id)
    if (!detalle[p.id]) {
      try {
        const data = await api.get<Planilla>(`/asistencias/proyectos/${p.proyectoId}/planillas/${p.id}`)
        setDetalle((prev) => ({ ...prev, [p.id]: data }))
      } catch {
        // el usuario puede reintentar cerrando y abriendo de nuevo
      }
    }
  }

  const kpis = useMemo(() => {
    const totalGeneral = planillas.reduce((s, p) => s + Number(p.totalGeneral), 0)
    const obras = new Set(planillas.map((p) => p.proyectoId)).size
    return { totalGeneral, cantidad: planillas.length, obras }
  }, [planillas])

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración/Gerencia pueden ver las planillas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Planillas</p>
          <p className="text-xl font-semibold tabular-nums">{kpis.cantidad}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Obras</p>
          <p className="text-xl font-semibold tabular-nums">{kpis.obras}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Total generado</p>
          <p className="text-xl font-semibold tabular-nums">{formatMonto(kpis.totalGeneral)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-4">
        <DateRangePicker value={rango} onValueChange={setRango} placeholder="Filtrar por periodo" className="max-w-64" />
        <Select value={proyectoId} onValueChange={(v) => setProyectoId(v ?? 'todos')}>
          <SelectTrigger className="max-w-56">
            <p>Obra</p>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las obras</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && planillas.length === 0 && !error && (
        <p className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
          Sin planillas generadas para este filtro.
        </p>
      )}

      {planillas.length > 0 && (
        <div className="space-y-1.5">
          {planillas.map((p) => {
            const item = detalle[p.id]
            const expandida = expandidaId === p.id
            return (
              <div key={p.id} className="rounded-xl border border-border bg-white">
                <button
                  type="button"
                  onClick={() => toggleExpandir(p)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium">{p.proyecto?.nombre ?? p.proyectoId}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(p.periodoInicio)} – {formatFecha(p.periodoFin)} · Generada por {p.generadaPor?.name ?? '—'} el {formatFechaHora(p.generadaEn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{formatMonto(Number(p.totalGeneral))}</span>
                    <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform ${expandida ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandida && (
                  <div className="space-y-1 border-t border-border p-3">
                    {!item ? (
                      <p className="text-xs text-muted-foreground">Cargando detalle...</p>
                    ) : (
                      item.items?.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                          <span>{it.trabajador?.nombre}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {Number(it.horasNormales).toFixed(1)}h{Number(it.horasExtraPagable) > 0 && ` + ${Number(it.horasExtraPagable).toFixed(1)}h extra`}
                          </span>
                          <span className="font-medium tabular-nums">{formatMonto(Number(it.total))}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
