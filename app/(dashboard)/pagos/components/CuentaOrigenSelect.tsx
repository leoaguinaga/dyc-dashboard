'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CuentaEmpresa, EmpresaConCuentas } from '@/types/api'

const SIN_CUENTA = 'sin-cuenta'

interface Props {
  /** Id de la cuenta elegida; '' = sin especificar. */
  value: string
  onChange: (cuentaId: string) => void
  className?: string
}

/**
 * Cuenta de la empresa de la que sale el dinero. Las cuentas vienen de /pagos/empresas
 * (la empresa del pago se deduce de la cuenta); si falta una, se da de alta aquí mismo.
 */
export function CuentaOrigenSelect({ value, onChange, className }: Props) {
  const [empresas, setEmpresas] = useState<EmpresaConCuentas[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [empresaId, setEmpresaId] = useState('')
  const [banco, setBanco] = useState('')
  const [numero, setNumero] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    api
      .get<EmpresaConCuentas[]>('/pagos/empresas')
      .then((data) => {
        if (!activo) return
        setEmpresas(data)
        setEmpresaId(data[0]?.id ?? '')
      })
      .catch(() => activo && setError('No se pudieron cargar las cuentas de la empresa'))
    return () => {
      activo = false
    }
  }, [])

  const variasEmpresas = (empresas?.length ?? 0) > 1
  const cuentas = (empresas ?? []).flatMap((e) =>
    e.cuentas.map((c) => ({ ...c, etiqueta: variasEmpresas ? `${c.banco} · ${c.numero} (${e.razonSocial})` : `${c.banco} · ${c.numero}` })),
  )

  async function agregarCuenta() {
    if (!banco.trim() || !numero.trim() || !empresaId) {
      setError('Indica el banco y el número de cuenta')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const nueva = await api.post<CuentaEmpresa>(`/pagos/empresas/${empresaId}/cuentas`, {
        banco: banco.trim(),
        numero: numero.trim(),
      })
      setEmpresas((previas) => (previas ?? []).map((e) => (e.id === empresaId ? { ...e, cuentas: [...e.cuentas, nueva] } : e)))
      onChange(nueva.id)
      setBanco('')
      setNumero('')
      setAgregando(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la cuenta')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={className}>
      <Select value={value || SIN_CUENTA} onValueChange={(v) => v && onChange(v === SIN_CUENTA ? '' : v)}>
        <SelectTrigger className="h-9 w-full text-xs" disabled={!empresas}>
          <SelectValue>
            {(v: string | null) =>
              !empresas
                ? 'Cargando cuentas…'
                : (cuentas.find((c) => c.id === v)?.etiqueta ?? 'Sin especificar')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SIN_CUENTA}>Sin especificar</SelectItem>
          {cuentas.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {empresas && !agregando && (
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3" />
          Agregar una cuenta de la empresa
        </button>
      )}

      {agregando && (
        <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          {variasEmpresas && (
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-white px-2 text-xs"
            >
              {empresas!.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.razonSocial}
                </option>
              ))}
            </select>
          )}
          <Input
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            placeholder="Banco, como lo rotula tesorería (BCP-D&C INGENIERIA Y PROYECTOS)"
            className="h-9 text-xs"
          />
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="N° de cuenta" className="h-9 font-mono text-xs" />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={agregarCuenta} disabled={guardando} className="h-8 text-xs">
              {guardando ? 'Guardando…' : 'Guardar cuenta'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAgregando(false)} disabled={guardando} className="h-8 text-xs">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  )
}
