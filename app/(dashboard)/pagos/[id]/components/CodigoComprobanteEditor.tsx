'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, RefreshCw, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

const FORMATO = /^\d{2}-\d{4,6}$/

interface Props {
  pagoId: string
  codigo: string | null | undefined
}

/** N° correlativo del comprobante (AA-NNNN). Editable: la empresa puede fijar desde qué número continuar. */
export function CodigoComprobanteEditor({ pagoId, codigo }: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(codigo ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function abrir() {
    setValor(codigo ?? '')
    setError(null)
    setEditando(true)
  }

  async function guardar() {
    const limpio = valor.trim()
    // Vacío = pedir al sistema el siguiente correlativo (pagos anteriores a esta función).
    if (limpio && !FORMATO.test(limpio)) {
      setError('Usa el formato AA-NNNN, por ejemplo 26-2078.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.patch(`/pagos/${pagoId}/codigo-comprobante`, limpio ? { codigo: limpio } : {})
      setEditando(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el código')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-2 shadow-xs">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        N° de comprobante
      </h2>

      {editando ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardar()
                if (e.key === 'Escape') setEditando(false)
              }}
              placeholder="26-2078"
              className="h-8 w-32 rounded-lg border border-border bg-white px-3 font-mono text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            <Button size="sm" onClick={guardar} disabled={guardando} className="h-8 gap-1.5 text-xs">
              {guardando ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Guardar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditando(false)}
              disabled={guardando}
              className="h-8 text-xs"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Formato AA-NNNN. Los siguientes pagos continuarán desde este número.
            {!codigo && ' Déjalo vacío para asignar el siguiente correlativo.'}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold text-foreground">
            {codigo ?? 'Sin asignar'}
          </span>
          <button
            type="button"
            onClick={abrir}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <Pencil className="size-3" />
            {codigo ? 'Editar' : 'Asignar'}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}
