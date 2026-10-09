'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UNIDAD_LABELS } from '@/lib/inventario'
import { parsearPegado, type FilaPegada } from '@/lib/requerimientos-paste'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (filas: FilaPegada[]) => void
  /** Muestra el P.U. pegado (compras ya cotizadas). */
  conPrecio?: boolean
}

export function PegarExcelModal({ open, onOpenChange, onConfirm, conPrecio = false }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pegar desde Excel</DialogTitle>
          <DialogDescription>
            Copia las filas del formato de requerimiento (Cant., U.D.M., Concepto, P.U., Total, Observación), con o sin la columna Ítem. Revisa la vista previa antes de agregarlas.
          </DialogDescription>
        </DialogHeader>
        {open && <PegarForm onCancel={() => onOpenChange(false)} onConfirm={onConfirm} conPrecio={conPrecio} />}
      </DialogContent>
    </Dialog>
  )
}

function PegarForm({ onCancel, onConfirm, conPrecio }: { onCancel: () => void; onConfirm: (filas: FilaPegada[]) => void; conPrecio: boolean }) {
  const [texto, setTexto] = useState('')
  const filas = useMemo(() => parsearPegado(texto).filter((f) => f.descripcion), [texto])
  const sinUnidad = filas.filter((f) => f.unidad === null).length

  return (
    <>
      <Textarea
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Pega aquí con Ctrl+V"
        aria-label="Celdas copiadas desde Excel"
        className="min-h-24 font-mono text-xs"
      />

      {filas.length > 0 && (
        <div className="max-h-64 overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 font-medium">Cant.</th>
                <th className="px-2 py-1.5 font-medium">Unidad</th>
                <th className="px-2 py-1.5 font-medium">Descripción</th>
                {conPrecio ? (
                  <th className="px-2 py-1.5 text-right font-medium">P. unitario</th>
                ) : (
                  <th className="px-2 py-1.5 font-medium">Observaciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-2 py-1.5 font-mono tabular-nums">{f.cantidad || '—'}</td>
                  <td className="px-2 py-1.5">
                    {f.unidad ? (
                      UNIDAD_LABELS[f.unidad]
                    ) : (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-700">
                        «{f.unidadOriginal}» · elegir unidad
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">{f.descripcion}</td>
                  {conPrecio ? (
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{f.precio || '—'}</td>
                  ) : (
                    <td className="px-2 py-1.5 text-muted-foreground">{f.observacion}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sinUnidad > 0 && (
        <p className="text-xs text-amber-700">
          {sinUnidad === 1 ? '1 fila trae una unidad' : `${sinUnidad} filas traen unidades`} que no reconozco. Quedarán por elegir en la tabla.
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" disabled={filas.length === 0} onClick={() => onConfirm(filas)}>
          {filas.length === 1 ? 'Agregar 1 fila' : `Agregar ${filas.length} filas`}
        </Button>
      </DialogFooter>
    </>
  )
}
