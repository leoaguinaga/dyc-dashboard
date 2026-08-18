'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { Cobro } from '@/types/api'
import { cn, formatDateOnly } from '@/lib/utils'

const ESTADO_LABEL: Record<Cobro['estadoEfectivo'], string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  cobrado: 'Cobrado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Cobro['estadoEfectivo'], string> = {
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  cobrado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function FilaCobro({ c }: { c: Cobro }) {
  return (
    <Link
      href={`/cobros/${c.id}`}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors duration-[120ms]"
    >
      <div className="flex items-center gap-2 min-w-0">
        {c.estadoEfectivo === 'vencido' && <AlertTriangle className="size-3.5 shrink-0 text-destructive" />}
        <div className="min-w-0">
          <span className="text-sm font-medium">{c.proyecto.codigo ?? c.proyecto.nombre}</span>
          <p className="truncate text-xs text-muted-foreground">
            {c.estado === 'pendiente' || c.estado === 'cancelado'
              ? `Programado para ${formatDateOnly(c.fechaProgramada)}`
              : `Cobrado el ${formatDateOnly(c.fechaCobrada!)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[c.estadoEfectivo])}>
          {ESTADO_LABEL[c.estadoEfectivo]}
        </span>
        <span className="w-28 text-right text-sm font-medium tabular-nums">{fmtMoney(Number(c.monto))}</span>
      </div>
    </Link>
  )
}

export function CobrosView({ cobros }: { cobros: Cobro[] }) {
  const [tab, setTab] = useState<'pendientes' | 'cobrados'>('pendientes')

  const pendientes = useMemo(
    () =>
      [...cobros.filter((c) => c.estado === 'pendiente')].sort(
        (a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada),
      ),
    [cobros],
  )
  const cobrados = useMemo(
    () =>
      [...cobros.filter((c) => c.estado === 'cobrado')].sort(
        (a, b) => (b.fechaCobrada ?? '').localeCompare(a.fechaCobrada ?? ''),
      ),
    [cobros],
  )

  const items = tab === 'pendientes' ? pendientes : cobrados

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
        <button
          onClick={() => setTab('pendientes')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]',
            tab === 'pendientes' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab('cobrados')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]',
            tab === 'cobrados' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Cobrados
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {tab === 'pendientes' ? 'No hay cobros pendientes' : 'No hay cobros registrados'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden divide-y divide-border">
          {items.map((c) => (
            <FilaCobro key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}
