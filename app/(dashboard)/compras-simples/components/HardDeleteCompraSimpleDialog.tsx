'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CompraSimple } from '@/types/api'

interface ImpactoEliminacion {
  compraSimple: Pick<CompraSimple, 'id' | 'codigo' | 'nombre'>
  entidadesAfectadas: {
    comprasSimples: number
    ordenesCompra: number
    items: number
    pagos: number
    historialAprobacion: number
    archivos: number
    notificaciones: number
  }
  totalRegistros: number
  pagosPagados: number
  advertencias: string[]
}

interface ResultadoEliminacion extends ImpactoEliminacion {
  eliminado: true
  verificacion: {
    registrosRelacionadosRestantes: number
    archivosFisicosEliminados: number
    archivosFisicosNoEliminados: number
  }
}

interface Props {
  compra: Pick<CompraSimple, 'id' | 'codigo' | 'nombre'>
  onDeleted: (resultado: ResultadoEliminacion) => void
}

const ENTITY_LABELS: Record<keyof ImpactoEliminacion['entidadesAfectadas'], string> = {
  comprasSimples: 'Compra simple',
  ordenesCompra: 'Grupos / órdenes de compra',
  items: 'Ítems de las órdenes',
  pagos: 'Pagos asociados',
  historialAprobacion: 'Registros del historial',
  archivos: 'Archivos adjuntos',
  notificaciones: 'Notificaciones internas',
}

export function HardDeleteCompraSimpleDialog({ compra, onDeleted }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [impacto, setImpacto] = useState<ImpactoEliminacion | null>(null)
  const [confirmacion, setConfirmacion] = useState('')
  const [loadingImpacto, setLoadingImpacto] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenChange(nextOpen: boolean) {
    if (deleting) return
    setOpen(nextOpen)
    if (!nextOpen) return

    setImpacto(null)
    setConfirmacion('')
    setError(null)
    setLoadingImpacto(true)
    try {
      const result = await api.get<ImpactoEliminacion>(`/compras-simples/${compra.id}/eliminacion-impacto`)
      setImpacto(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo analizar el impacto')
    } finally {
      setLoadingImpacto(false)
    }
  }

  async function deletePermanently() {
    if (!impacto || confirmacion !== compra.codigo) return
    setDeleting(true)
    setError(null)
    try {
      const result = await api.delete<ResultadoEliminacion>(`/compras-simples/${compra.id}`, { confirmacion })
      setOpen(false)
      onDeleted(result)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la eliminación')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => void handleOpenChange(true)}
        title={`Eliminar permanentemente ${compra.codigo}`}
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Eliminar permanentemente {compra.codigo}</span>
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => void handleOpenChange(nextOpen)}>
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Eliminar permanentemente {compra.codigo}</DialogTitle>
            <DialogDescription>Esta acción es exclusiva de admin_ti, no se puede deshacer y elimina también los registros dependientes.</DialogDescription>
          </DialogHeader>

          {loadingImpacto ? (
            <div className="space-y-2" aria-label="Analizando impacto">
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
            </div>
          ) : impacto ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{impacto.totalRegistros} registros serán eliminados</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{compra.nombre}</p>
                  </div>
                </div>
              </div>

              <dl className="divide-y divide-border rounded-lg border border-border">
                {Object.entries(impacto.entidadesAfectadas).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                    <dt className="text-muted-foreground">{ENTITY_LABELS[key as keyof typeof ENTITY_LABELS]}</dt>
                    <dd className="font-mono font-medium tabular-nums">{count}</dd>
                  </div>
                ))}
              </dl>

              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {impacto.advertencias.map((advertencia) => (
                  <li key={advertencia}>• {advertencia}</li>
                ))}
              </ul>

              <div className="space-y-1.5">
                <label htmlFor={`confirm-delete-${compra.id}`} className="text-sm font-medium">
                  Escribe <span className="font-mono">{compra.codigo}</span> para confirmar
                </label>
                <Input
                  id={`confirm-delete-${compra.id}`}
                  value={confirmacion}
                  onChange={(event) => setConfirmacion(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!confirmacion && confirmacion !== compra.codigo}
                />
              </div>
            </div>
          ) : null}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" disabled={!impacto || confirmacion !== compra.codigo || deleting} onClick={() => void deletePermanently()}>
              {deleting ? 'Eliminando y verificando…' : 'Eliminar permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
