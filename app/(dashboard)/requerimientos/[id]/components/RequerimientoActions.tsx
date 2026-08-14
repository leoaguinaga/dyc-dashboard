'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Send, ClipboardList, FileDown } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { downloadRequerimientoPDF } from './RequerimientoPDF'
import { TIPO_APPROVERS, TIPO_APPROVER_LABEL } from '@/lib/requerimientos'
import { formatCurrency } from '@/lib/utils'
import type { Requerimiento, Role } from '@/types/api'

// Roles que representan al solicitante real (quien generó el requerimiento).
const ROLES_SOLICITANTE: Role[] = ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr']

interface Props {
  requerimiento: Requerimiento
}

export function RequerimientoActions({ requerimiento: r }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [notaObservacion, setNotaObservacion] = useState('')
  const [showObservar, setShowObservar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function action(endpoint: string, body?: object) {
    setLoading(endpoint)
    setError(null)
    try {
      await api.post(`/requerimientos/${r.id}/${endpoint}`, body ?? {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la acción')
    } finally {
      setLoading(null)
    }
  }

  async function aprobarCotizacion(solicitudId: string) {
    const key = `aprobar-cotizacion-${solicitudId}`
    setLoading(key)
    setError(null)
    try {
      await api.post(`/solicitudes-cotizacion/${solicitudId}/aprobar-solicitante`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar la cotización')
    } finally {
      setLoading(null)
    }
  }

  const approvers = role ? TIPO_APPROVERS[r.tipo] ?? [] : []
  const autoAprueba = role ? approvers.includes(role) : false
  // Cuando está "observado", la edición y el reenvío se hacen desde el formulario
  // de corrección embebido en la sección de ítems — no se duplica el botón aquí.
  const canEnviar = r.estado === 'borrador' && (
    role === 'administrador' || role === 'admin_ti' || r.creadoPorId === session?.user?.id
  )
  const canAprobarObservar = r.estado === 'enviado' && approvers.includes(role!)
  const canCrearCotizacion = r.estado === 'aprobado' && (role === 'logistica' || role === 'administrador' || role === 'admin_ti' || role === 'gerencia')
  const canExportarPDF = r.estado === 'aprobado'

  const FLUJO_STEPS: { estado: string; label: string }[] = [
    { estado: 'borrador',  label: 'Borrador' },
    { estado: 'enviado',   label: `En revisión (${TIPO_APPROVER_LABEL[r.tipo] ?? '—'})` },
    { estado: 'aprobado',  label: 'Aprobado' },
    { estado: 'en_cotizacion', label: 'En cotización' },
    { estado: 'pendiente_conformidad', label: 'Pendiente de conformidad' },
    { estado: 'recibido', label: 'Recibido' },
  ]
  // "observado" sigue dentro del ciclo de revisión — se muestra en el mismo paso que "enviado"
  const stepIdx = FLUJO_STEPS.findIndex((s) => s.estado === (r.estado === 'observado' ? 'enviado' : r.estado))

  const hayFlujoQueMostrar = stepIdx >= 0
  if (!canEnviar && !canAprobarObservar && !canCrearCotizacion && !canExportarPDF && !hayFlujoQueMostrar) return null

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acciones</h2>

      {/* Progreso del flujo */}
      <ol className="flex flex-col gap-1.5">
        {FLUJO_STEPS.map((step, i) => {
          const done = stepIdx > i
          const active = stepIdx === i
          return (
            <li key={step.estado} className="flex items-center gap-2 text-xs">
              <span className={[
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                done  ? 'bg-chart-2 text-white' :
                active ? 'bg-primary text-white' :
                         'border border-border text-muted-foreground',
              ].join(' ')}>
                {done ? '✓' : i + 1}
              </span>
              <span className={active ? 'font-medium' : done ? 'text-chart-2' : 'text-muted-foreground'}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      {(r.solicitudes?.length ?? 0) > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seguimiento de compra</h3>
          {r.solicitudes!.map((s) => {
            const cotizacion = s.cotizaciones?.[0]
            const total = cotizacion
              ? cotizacion.items.reduce((sum, i) => sum + Number(i.precioUnit) * Number(i.cantidad), 0)
              : null
            const esSolicitanteDueño = !!role && ROLES_SOLICITANTE.includes(role) && r.creadoPorId === session?.user?.id
            // El solicitante aprueba lo suyo; logística/gerencia/admin pueden aprobar en su
            // lugar por premura (mismo permiso que ya tenían en /cotizaciones) — queda
            // registrado quién aprobó realmente antes de que gerencia dé su visto bueno.
            const puedeAprobarCotizacion = s.estado === 'seleccionada' && (
              esSolicitanteDueño ||
              role === 'administrador' || role === 'admin_ti' ||
              role === 'gerencia' || role === 'logistica'
            )
            const loadingKey = `aprobar-cotizacion-${s.id}`
            return (
              <div key={s.id} className="rounded-lg border border-border p-2.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Solicitud {s.codigo}</span>
                  <span className="text-muted-foreground capitalize">{s.estado.replaceAll('_', ' ')}</span>
                </div>
                {cotizacion && (
                  <div className="pl-2 border-l-2 border-border space-y-1">
                    <p className="text-foreground font-medium">{cotizacion.proveedor.razonSocial}</p>
                    {/* Ítems exactamente como quedaron marcados para pasar a la OC — pueden
                        diferir de lo pedido originalmente (cambios/agregados del proveedor). */}
                    <ul className="space-y-0.5">
                      {cotizacion.items.map((i, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2 text-muted-foreground">
                          <span className="truncate">{i.descripcionProveedor} · {i.cantidad} {i.unidad}</span>
                          <span className="shrink-0 tabular-nums">{formatCurrency(Number(i.precioUnit) * Number(i.cantidad))}</span>
                        </li>
                      ))}
                    </ul>
                    {total !== null && (
                      <div className="flex items-center justify-between border-t border-border/70 pt-1 font-medium text-foreground">
                        <span>Total</span>
                        <span className="tabular-nums">{formatCurrency(total)}</span>
                      </div>
                    )}
                  </div>
                )}
                {s.aprobadaSolicitantePor && (
                  <p className="pl-2 text-muted-foreground">
                    Aprobado por {s.aprobadaSolicitantePor.name}
                    {s.aprobadaSolicitantePorRole && ` (${s.aprobadaSolicitantePorRole})`}
                  </p>
                )}
                {puedeAprobarCotizacion && (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={loading !== null}
                    onClick={() => aprobarCotizacion(s.id)}
                  >
                    <CheckCircle2 className="size-4" />
                    {loading === loadingKey ? 'Aprobando…' : 'Aprobar cotización'}
                  </Button>
                )}
                {s.ordenes.map((oc) => (
                  <div key={oc.id} className="flex items-center justify-between text-muted-foreground pl-2 border-l-2 border-border">
                    <span>OC {oc.numero} — {oc.proveedor?.razonSocial ?? oc.proveedorNombreLibre ?? 'Sin proveedor'}</span>
                    <span className="capitalize">{oc.estado.replaceAll('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <div className="border-t border-border pt-3 space-y-2">

      {canEnviar && (
        <Button
          className="w-full"
          disabled={loading !== null}
          onClick={() => action('enviar')}
        >
          <Send className="size-4" />
          {loading === 'enviar'
            ? 'Enviando…'
            : autoAprueba
              ? 'Enviar (aprobación automática)'
              : `Enviar a ${TIPO_APPROVER_LABEL[r.tipo] ?? 'revisión'}`}
        </Button>
      )}

      {canAprobarObservar && (
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={loading !== null}
            onClick={() => action('aprobar')}
          >
            <CheckCircle2 className="size-4" />
            {loading === 'aprobar' ? 'Aprobando…' : 'Aprobar requerimiento'}
          </Button>

          {!showObservar ? (
            <Button
              variant="outline"
              className="w-full text-amber-600 border-amber-500/30 hover:bg-amber-500/5"
              disabled={loading !== null}
              onClick={() => setShowObservar(true)}
            >
              <XCircle className="size-4" />
              Observar
            </Button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={notaObservacion}
                onChange={(e) => setNotaObservacion(e.target.value)}
                placeholder="¿Qué debe corregir el solicitante? (obligatorio)…"
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowObservar(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/5"
                  disabled={loading !== null || !notaObservacion.trim()}
                  onClick={() => action('observar', { notaRevision: notaObservacion.trim() })}
                >
                  {loading === 'observar' ? 'Observando…' : 'Confirmar observación'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {canCrearCotizacion && (
        <Link
          href={`/cotizaciones/nueva?requerimientoId=${r.id}`}
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
        >
          <ClipboardList className="size-4" />
          Crear solicitud de cotización
        </Link>
      )}

      {canExportarPDF && (
        <Button
          variant="outline"
          className="w-full"
          disabled={pdfLoading}
          onClick={async () => {
            setPdfLoading(true)
            await downloadRequerimientoPDF(r)
            setPdfLoading(false)
          }}
        >
          <FileDown className="size-4" />
          {pdfLoading ? 'Generando PDF…' : 'Exportar solicitud de materiales'}
        </Button>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      </div>
    </div>
  )
}
