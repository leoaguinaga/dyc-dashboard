'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NIVEL_LABELS } from '@/lib/accesos'
import { cn } from '@/lib/utils'
import type { AccesoPorDefecto, NivelAcceso } from '@/types/api'

const POR_DEFECTO = 'por_defecto'

export function etiquetaPorDefecto(d: AccesoPorDefecto) {
  return `${NIVEL_LABELS[d.nivel]}${d.parcial ? ' (parcial)' : ''}`
}

interface Props {
  /** Lo que aplica sin excepción (código o, para un usuario, su rol). */
  heredado: AccesoPorDefecto
  heredadoLabel: string
  valor: NivelAcceso | null
  onChange: (nivel: NivelAcceso | null) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
}

/** Selector de una excepción de acceso: "heredado" o un nivel explícito. */
export function NivelAccesoSelect({
  heredado,
  heredadoLabel,
  valor,
  onChange,
  disabled,
  ariaLabel,
  className,
}: Props) {
  const items = {
    [POR_DEFECTO]: `${heredadoLabel}: ${etiquetaPorDefecto(heredado)}`,
    ninguno: NIVEL_LABELS.ninguno,
    ver: NIVEL_LABELS.ver,
    editar: NIVEL_LABELS.editar,
  }

  return (
    <Select
      items={items}
      value={valor ?? POR_DEFECTO}
      onValueChange={(v) => onChange(v === POR_DEFECTO ? null : (v as NivelAcceso))}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(
          'w-full min-w-36 normal-case',
          valor !== null && 'border-primary/50 bg-primary/5 font-medium text-primary',
          valor === null && 'text-muted-foreground',
          className,
        )}
      >
        <SelectValue className="normal-case" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={POR_DEFECTO}>{items[POR_DEFECTO]}</SelectItem>
        <SelectItem value="ninguno">{NIVEL_LABELS.ninguno}</SelectItem>
        <SelectItem value="ver">{NIVEL_LABELS.ver}</SelectItem>
        <SelectItem value="editar">{NIVEL_LABELS.editar}</SelectItem>
      </SelectContent>
    </Select>
  )
}
