'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, RefreshCw, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import { useSession } from '@/lib/auth/session'
import type { EstadoRendicion, Pago } from '@/types/api'
import { CuentaOrigenSelect } from '../../components/CuentaOrigenSelect'

const ESTADO_LABEL: Record<EstadoRendicion, string> = { abierto: 'Abierta', cerrado: 'Cerrada' }
const ESTADO_CLASS: Record<EstadoRendicion, string> = {
  abierto: 'border-amber-200 bg-amber-50 text-amber-700',
  cerrado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

interface Props {
  pago: Pago
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-muted-foreground">{etiqueta}</span>
      <div className="mt-0.5 font-medium text-foreground">{children}</div>
    </div>
  )
}

/** Quién paga, de qué cuenta sale el dinero y cómo va la rendición del gasto. */
export function RendicionCard({ pago }: Props) {
  const { data: session } = useSession()
  // Tesorería y administración corrigen estos datos (mismos roles que registran el pago).
  const puedeEditar = ['administrador', 'gerencia', 'admin_ti', 'tesoreria'].includes(session?.user?.role ?? '')
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [cuentaOrigenId, setCuentaOrigenId] = useState(pago.cuentaOrigenId ?? '')
  const [responsable, setResponsable] = useState(pago.responsableRendicionNombre ?? '')
  const [importeRendido, setImporteRendido] = useState(pago.importeRendido ?? '')
  const [estado, setEstado] = useState<EstadoRendicion | ''>(pago.estadoRendicion ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function abrir() {
    setCuentaOrigenId(pago.cuentaOrigenId ?? '')
    setResponsable(pago.responsableRendicionNombre ?? '')
    setImporteRendido(pago.importeRendido ?? '')
    setEstado(pago.estadoRendicion ?? '')
    setError(null)
    setEditando(true)
  }

  async function guardar() {
    const rendido = String(importeRendido).trim()
    if (rendido && (!Number.isFinite(Number(rendido)) || Number(rendido) < 0)) {
      setError('El importe rendido debe ser un número igual o mayor que cero.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.patch(`/pagos/${pago.id}/rendicion`, {
        cuentaOrigenId: cuentaOrigenId || undefined,
        // Si el nombre no cambió se conserva el vínculo con el trabajador.
        ...(responsable.trim() === (pago.responsableRendicionNombre ?? '') ? {} : { responsableRendicionNombre: responsable.trim() }),
        importeRendido: rendido ? Number(rendido) : undefined,
        estadoRendicion: estado || undefined,
      })
      setEditando(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la rendición')
    } finally {
      setGuardando(false)
    }
  }

  const responsableNombre = pago.responsableRendicionNombre ?? pago.responsableRendicion?.nombre
  const generadoPor = pago.pagadoPor?.name ?? pago.generadoPorNombre

  return (
    <div className="space-y-3.5 rounded-xl border border-border bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa y rendición</h2>
        {puedeEditar && !editando && (
          <button
            type="button"
            onClick={abrir}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <Pencil className="size-3" />
            Editar
          </button>
        )}
      </div>

      {editando ? (
        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1.5 block font-medium text-foreground">Cuenta de la empresa de la que salió el dinero</label>
            <CuentaOrigenSelect value={cuentaOrigenId} onChange={setCuentaOrigenId} />
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-foreground">Responsable de la rendición</label>
            <Input
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Quien sustenta el gasto, o ADMINISTRACION"
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-medium text-foreground">Importe rendido (S/)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={importeRendido}
                onChange={(e) => setImporteRendido(e.target.value)}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-medium text-foreground">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoRendicion | '')}
                className="h-9 w-full rounded-lg border border-border bg-white px-2 text-sm"
              >
                <option value="">Sin definir</option>
                <option value="abierto">Abierta</option>
                <option value="cerrado">Cerrada</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={guardar} disabled={guardando} className="h-8 gap-1.5 text-xs">
              {guardando ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Guardar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditando(false)} disabled={guardando} className="h-8 text-xs">
              <X className="size-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <Dato etiqueta="Empresa">
            {pago.empresa ? (
              <>
                <p className="break-words text-sm">{pago.empresa.razonSocial}</p>
                <span className="block text-[11px] font-normal text-muted-foreground">RUC {pago.empresa.ruc}</span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Dato>
          <Dato etiqueta="Cuenta de origen">
            {pago.cuentaOrigen ? (
              <>
                <p className="break-words text-sm">{pago.cuentaOrigen.banco}</p>
                <span className="block font-mono text-[11px] font-normal text-muted-foreground">{pago.cuentaOrigen.numero}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No registrada</span>
            )}
          </Dato>
          <Dato etiqueta="Responsable de la rendición">{responsableNombre ?? <span className="text-muted-foreground">No registrado</span>}</Dato>
          <Dato etiqueta="Rendición">
            <span className="tabular-nums">
              {pago.importeRendido !== null && pago.importeRendido !== undefined
                ? `${formatCurrency(pago.importeRendido)} de ${formatCurrency(pago.monto)}`
                : <span className="text-muted-foreground">Sin importe rendido</span>}
            </span>
            {pago.estadoRendicion && (
              <span className={cn('ml-2 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium', ESTADO_CLASS[pago.estadoRendicion])}>
                {ESTADO_LABEL[pago.estadoRendicion]}
              </span>
            )}
          </Dato>
          {generadoPor && <Dato etiqueta="Generó la constancia">{generadoPor}</Dato>}
        </div>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
