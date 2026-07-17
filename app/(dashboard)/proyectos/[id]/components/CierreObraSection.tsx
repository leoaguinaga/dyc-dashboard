'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, FileDown, CheckCircle2 } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Proyecto } from '@/types/api'

interface Resumen {
  gastoTotal: number
  cantidadOrdenesCompra: number
  cantidadTrabajadores: number
}

interface Props {
  proyecto: Proyecto
}

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CierreObraSection({ proyecto }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)

  const role = session?.user?.role
  const canClose = role === 'administrador' || role === 'gerencia'
  const trabajadores = proyecto.trabajadores ?? []
  const estaCerrada = proyecto.estado === 'cierre' || proyecto.estado === 'liquidada'

  async function handleCerrar() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.patch<{ resumen: Resumen }>(`/proyectos/${proyecto.id}/cerrar`, {})
      setResumen(result.resumen)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar la obra')
    } finally {
      setLoading(false)
    }
  }

  if (!canClose && !estaCerrada) return null

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Cierre de obra</h2>
        {canClose && proyecto.estado === 'ejecucion' && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Lock className="size-3.5" />
            Cerrar obra
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {resumen && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-chart-2/10 p-3 text-sm">
          <CheckCircle2 className="size-4 text-chart-2 shrink-0" />
          <span>
            Obra cerrada. Gasto total <span className="font-semibold">{fmtMoney(resumen.gastoTotal)}</span> en{' '}
            {resumen.cantidadOrdenesCompra} orden(es) de compra, {resumen.cantidadTrabajadores} trabajador(es) participantes.
          </span>
        </div>
      )}

      {estaCerrada && trabajadores.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Constancias de trabajo</p>
          <div className="flex flex-wrap gap-2">
            {trabajadores.map((t) => (
              <a
                key={t.id}
                href={`/api/proyectos/${proyecto.id}/trabajadores/${t.trabajadorId}/certificado`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground transition-colors duration-[120ms] hover:bg-muted"
              >
                <FileDown className="size-3.5" />
                {t.trabajador.nombre}
              </a>
            ))}
          </div>
        </div>
      )}

      {!estaCerrada && !canClose && (
        <p className="text-sm text-muted-foreground">Sin acciones disponibles.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar obra</DialogTitle>
            <DialogDescription>
              Se bloquearán nuevos requerimientos para esta obra. La operación falla si hay requerimientos,
              solicitudes de cotización u órdenes de compra en curso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleCerrar} disabled={loading}>
              {loading ? 'Cerrando…' : 'Confirmar cierre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
