'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CategoriaObrero } from '@/types/api'
import { CATEGORIAS_OBRERO, type PerfilObreroState } from './perfil-obrero-constants'

const labelCn = 'mb-1.5 block text-sm font-medium'

interface Props {
  value: PerfilObreroState
  onChange: <K extends keyof PerfilObreroState>(key: K, value: PerfilObreroState[K]) => void
}

export function PerfilObreroFields({ value, onChange }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in-0 slide-in-from-top-1 duration-[200ms]">
      <div>
        <label className={labelCn}>Categoría (régimen de construcción civil)</label>
        <Select value={value.categoria} onValueChange={(v) => onChange('categoria', (v ?? '') as CategoriaObrero | '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_OBRERO.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className={labelCn}>Precio por hora (S/)</label>
        <Input
          type="number"
          step="0.01"
          value={value.precioHora}
          onChange={(e) => onChange('precioHora', e.target.value)}
          placeholder="Ej. 12.50"
          className="font-mono"
        />
      </div>
      <div>
        <label className={labelCn}>Tipo de sangre</label>
        <Input
          value={value.tipoSangre}
          onChange={(e) => onChange('tipoSangre', e.target.value)}
          placeholder="Ej. O+"
        />
      </div>
      <div>
        <label className={labelCn}>N° de póliza SCTR</label>
        <Input
          value={value.numeroSctr}
          onChange={(e) => onChange('numeroSctr', e.target.value)}
          placeholder="Seguro Complementario de Trabajo de Riesgo"
          className="font-mono"
        />
      </div>
      <div>
        <label className={labelCn}>Contacto de emergencia — nombre</label>
        <Input
          value={value.contactoEmergenciaNombre}
          onChange={(e) => onChange('contactoEmergenciaNombre', e.target.value)}
          placeholder="Nombre completo"
        />
      </div>
      <div>
        <label className={labelCn}>Contacto de emergencia — teléfono</label>
        <Input
          value={value.contactoEmergenciaTelefono}
          onChange={(e) => onChange('contactoEmergenciaTelefono', e.target.value)}
          placeholder="987 654 321"
          className="font-mono"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCn}>Dirección</label>
        <Input
          value={value.direccion}
          onChange={(e) => onChange('direccion', e.target.value)}
          placeholder="Dirección de domicilio"
        />
      </div>
      <div>
        <label className={labelCn}>Talla de uniforme</label>
        <Input
          value={value.tallaUniforme}
          onChange={(e) => onChange('tallaUniforme', e.target.value)}
          placeholder="Ej. M, L, XL"
        />
      </div>
      <div>
        <label className={labelCn}>Talla de calzado (botas de seguridad)</label>
        <Input
          value={value.tallaCalzado}
          onChange={(e) => onChange('tallaCalzado', e.target.value)}
          placeholder="Ej. 42"
        />
      </div>
    </div>
  )
}
