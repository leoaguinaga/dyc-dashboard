'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const CATEGORIAS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'yape_plin', label: 'Yape/Plin' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' },
] as const

type Categoria = (typeof CATEGORIAS)[number]['value']

const BANCOS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Banco de la Nación']

function parseMetodoPago(metodo: string, bancoSugerido?: string): { categoria: Categoria; banco: string } {
  const m = metodo.toLowerCase()
  const bancoPorDefecto = bancoSugerido ?? BANCOS[0]
  if (m.includes('yape') || m.includes('plin')) return { categoria: 'yape_plin', banco: bancoPorDefecto }
  if (m.includes('cheque')) return { categoria: 'cheque', banco: bancoPorDefecto }
  if (m.includes('efectivo')) return { categoria: 'efectivo', banco: bancoPorDefecto }
  const banco = BANCOS.find((b) => m.includes(b.toLowerCase())) ?? bancoPorDefecto
  return { categoria: 'transferencia', banco }
}

function componerMetodoPago(categoria: Categoria, banco: string): string {
  switch (categoria) {
    case 'transferencia':
      return `Transferencia ${banco}`
    case 'yape_plin':
      return 'Yape/Plin'
    case 'efectivo':
      return 'Efectivo'
    case 'cheque':
      return 'Cheque'
  }
}

export function MetodoPagoSelect({
  value,
  onChange,
  bancoSugerido,
  className,
}: {
  value: string
  onChange: (value: string) => void
  bancoSugerido?: string
  className?: string
}) {
  const { categoria, banco } = parseMetodoPago(value, bancoSugerido)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Select
        value={categoria}
        onValueChange={(v) => {
          if (!v) return
          onChange(componerMetodoPago(v as Categoria, banco))
        }}
      >
        <SelectTrigger className="h-9 w-full text-xs">
          <SelectValue>
            {(v: Categoria | null) => CATEGORIAS.find((c) => c.value === v)?.label ?? ''}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CATEGORIAS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {categoria === 'transferencia' && (
        <Select value={banco} onValueChange={(v) => v && onChange(componerMetodoPago('transferencia', v))}>
          <SelectTrigger className="h-9 w-full text-xs">
            <SelectValue>{(v: string | null) => v ?? ''}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BANCOS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
