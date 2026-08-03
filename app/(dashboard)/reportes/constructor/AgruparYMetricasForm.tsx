'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FUNCION_METRICA_LABEL, type CampoReporte, type FuncionMetrica } from '@/lib/reportes/tipos'

export interface MetricaState {
  id: string
  campo: string
  funcion: FuncionMetrica
}

interface Props {
  campos: CampoReporte[]
  agruparPor: string[]
  onAgruparPorChange: (keys: string[]) => void
  metricas: MetricaState[]
  onMetricasChange: (metricas: MetricaState[]) => void
}

function funcionesDisponibles(campo: CampoReporte | undefined): FuncionMetrica[] {
  if (!campo) return ['count']
  return campo.metrica ? ['count', 'sum', 'avg', 'min', 'max'] : ['count']
}

export function AgruparYMetricasForm({ campos, agruparPor, onAgruparPorChange, metricas, onMetricasChange }: Props) {
  const agrupables = campos.filter((c) => c.agrupable)

  function toggleAgrupar(key: string) {
    onAgruparPorChange(agruparPor.includes(key) ? agruparPor.filter((k) => k !== key) : [...agruparPor, key])
  }

  function agregarMetrica() {
    const primero = campos[0]
    if (!primero) return
    onMetricasChange([...metricas, { id: crypto.randomUUID(), campo: primero.key, funcion: 'count' }])
  }

  function actualizarMetrica(id: string, patch: Partial<MetricaState>) {
    onMetricasChange(metricas.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  function quitarMetrica(id: string) {
    onMetricasChange(metricas.filter((m) => m.id !== id))
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Agrupar por</label>
        {agrupables.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta entidad no tiene campos agrupables.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {agrupables.map((campo) => {
              const activo = agruparPor.includes(campo.key)
              return (
                <button
                  key={campo.key}
                  type="button"
                  onClick={() => toggleAgrupar(campo.key)}
                  className={
                    activo
                      ? 'rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary'
                      : 'rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted'
                  }
                >
                  {campo.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Métricas</label>
          <Button type="button" variant="ghost" size="sm" onClick={agregarMetrica}>
            <Plus className="size-3.5" /> Agregar métrica
          </Button>
        </div>

        {metricas.length === 0 && <p className="text-sm text-muted-foreground">Sin métricas — se listan filas individuales.</p>}

        <div className="space-y-2">
          {metricas.map((m) => {
            const campo = campos.find((c) => c.key === m.campo)
            const funciones = funcionesDisponibles(campo)
            return (
              <div key={m.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <Select
                  value={m.campo}
                  onValueChange={(v) => {
                    if (!v) return
                    const nuevoCampo = campos.find((c) => c.key === v)
                    const opciones = funcionesDisponibles(nuevoCampo)
                    actualizarMetrica(m.id, { campo: v, funcion: opciones.includes(m.funcion) ? m.funcion : opciones[0] })
                  }}
                >
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {campos.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={m.funcion} onValueChange={(v) => v && actualizarMetrica(m.id, { funcion: v as FuncionMetrica })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {funciones.map((f) => (
                      <SelectItem key={f} value={f}>{FUNCION_METRICA_LABEL[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => quitarMetrica(m.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
