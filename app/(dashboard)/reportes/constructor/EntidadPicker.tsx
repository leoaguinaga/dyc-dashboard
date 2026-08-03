'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReporteEntidadMeta } from '@/lib/reportes/tipos'

interface Props {
  entidades: Record<string, ReporteEntidadMeta>
  value?: string
  onValueChange: (entidad: string) => void
}

export function EntidadPicker({ entidades, value, onValueChange }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Entidad</label>
      <Select value={value} onValueChange={(v) => v && onValueChange(v)}>
        <SelectTrigger className="h-9 w-full sm:w-72">
          <SelectValue placeholder="Elegir entidad…" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(entidades).map((meta) => (
            <SelectItem key={meta.entidad} value={meta.entidad}>
              {meta.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
