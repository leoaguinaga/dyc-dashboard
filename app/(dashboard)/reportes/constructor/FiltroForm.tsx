'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { RelacionCombobox } from '@/components/ui/relacion-combobox'
import { OPERADOR_LABEL, type CampoReporte, type OperadorFiltro } from '@/lib/reportes/tipos'

export interface FiltroState {
  id: string
  campo: string
  operador: OperadorFiltro
  valor: unknown
}

interface Props {
  campos: CampoReporte[]
  filtros: FiltroState[]
  onChange: (filtros: FiltroState[]) => void
}

function campoDe(campos: CampoReporte[], key: string): CampoReporte | undefined {
  return campos.find((c) => c.key === key)
}

function ValorInput({
  campo,
  operador,
  valor,
  onChange,
}: {
  campo: CampoReporte
  operador: OperadorFiltro
  valor: unknown
  onChange: (v: unknown) => void
}) {
  if (operador === 'in') {
    const texto = Array.isArray(valor) ? valor.join(', ') : ''
    return (
      <Input
        className="h-8"
        placeholder="valor1, valor2…"
        value={texto}
        onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
      />
    )
  }

  if (operador === 'between') {
    if (campo.tipo === 'date') {
      const [desde, hasta] = Array.isArray(valor) ? (valor as [string?, string?]) : [undefined, undefined]
      return (
        <DateRangePicker
          value={{ desde, hasta }}
          onValueChange={(r) => onChange([r.desde ?? '', r.hasta ?? ''])}
        />
      )
    }
    const [desde, hasta] = Array.isArray(valor) ? (valor as [string?, string?]) : ['', '']
    return (
      <div className="flex items-center gap-1.5">
        <Input className="h-8" type="number" placeholder="desde" value={desde ?? ''} onChange={(e) => onChange([e.target.value, hasta ?? ''])} />
        <Input className="h-8" type="number" placeholder="hasta" value={hasta ?? ''} onChange={(e) => onChange([desde ?? '', e.target.value])} />
      </div>
    )
  }

  switch (campo.tipo) {
    case 'date':
      return <DatePicker value={typeof valor === 'string' ? valor : undefined} onValueChange={onChange} />
    case 'number':
    case 'decimal':
      return <Input className="h-8" type="number" value={typeof valor === 'string' || typeof valor === 'number' ? valor : ''} onChange={(e) => onChange(e.target.value)} />
    case 'boolean':
      return (
        <Select value={valor === true ? 'true' : valor === false ? 'false' : undefined} onValueChange={(v) => v && onChange(v === 'true')}>
          <SelectTrigger className="h-8 w-full"><SelectValue placeholder="Elegir…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Sí</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'enum':
      return (
        <Select value={typeof valor === 'string' ? valor : undefined} onValueChange={(v) => v && onChange(v)}>
          <SelectTrigger className="h-8 w-full"><SelectValue placeholder="Elegir…" /></SelectTrigger>
          <SelectContent>
            {campo.enumValues?.map((ev) => (
              <SelectItem key={ev} value={ev}>{ev.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'relacion':
      return (
        <RelacionCombobox
          entidadRelacion={campo.relacion!.entidad}
          value={typeof valor === 'string' ? valor : undefined}
          onValueChange={onChange}
        />
      )
    default:
      return <Input className="h-8" value={typeof valor === 'string' ? valor : ''} onChange={(e) => onChange(e.target.value)} />
  }
}

export function FiltroForm({ campos, filtros, onChange }: Props) {
  const filtrables = campos.filter((c) => c.operadores.length > 0)

  function agregar() {
    const primero = filtrables[0]
    if (!primero) return
    onChange([...filtros, { id: crypto.randomUUID(), campo: primero.key, operador: primero.operadores[0], valor: undefined }])
  }

  function actualizar(id: string, patch: Partial<FiltroState>) {
    onChange(filtros.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function quitar(id: string) {
    onChange(filtros.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Filtros</label>
        <Button type="button" variant="ghost" size="sm" onClick={agregar} disabled={filtrables.length === 0}>
          <Plus className="size-3.5" /> Agregar filtro
        </Button>
      </div>

      {filtros.length === 0 && <p className="text-sm text-muted-foreground">Sin filtros — se incluyen todos los registros.</p>}

      <div className="space-y-2">
        {filtros.map((filtro) => {
          const campo = campoDe(filtrables, filtro.campo)
          if (!campo) return null
          return (
            <div key={filtro.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-2.5 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
              <Select
                value={filtro.campo}
                onValueChange={(v) => {
                  if (!v) return
                  const nuevoCampo = campoDe(filtrables, v)
                  actualizar(filtro.id, { campo: v, operador: nuevoCampo?.operadores[0] ?? 'eq', valor: undefined })
                }}
              >
                <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filtrables.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtro.operador} onValueChange={(v) => v && actualizar(filtro.id, { operador: v as OperadorFiltro, valor: undefined })}>
                <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {campo.operadores.map((op) => (
                    <SelectItem key={op} value={op}>{OPERADOR_LABEL[op]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ValorInput campo={campo} operador={filtro.operador} valor={filtro.valor} onChange={(v) => actualizar(filtro.id, { valor: v })} />

              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => quitar(filtro.id)}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
