'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/auth/session'
import type { CompraSimple, TipoRequerimiento } from '@/types/api'

// Debe coincidir con ROLES_CREACION en compras-simples.service.ts
const CON_ACCESO_CREACION = ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr', 'administrador']

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Admin.',
}

const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: 'bg-blue-500/10 text-blue-600',
  electrico: 'bg-amber-500/10 text-amber-600',
  seguridad: 'bg-orange-500/10 text-orange-600',
  administrativo: 'bg-purple-500/10 text-purple-600',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(v: string) {
  return `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function resumenEstado(compra: CompraSimple) {
  const total = compra.grupos.length
  const aprobados = compra.grupos.filter((g) => g.estadoAprobacion === 'aprobada').length
  const observados = compra.grupos.filter((g) => g.estadoAprobacion === 'observada').length

  if (aprobados === total) return { label: 'Todo aprobado', className: 'bg-chart-2/15 text-chart-2' }
  if (observados > 0) return { label: `${observados} observado(s)`, className: 'bg-amber-500/15 text-amber-600' }
  return { label: `${aprobados}/${total} aprobados`, className: 'bg-blue-500/15 text-blue-600' }
}

interface Props {
  compras: CompraSimple[]
}

export function ComprasSimplesTableClient({ compras }: Props) {
  const { data: session } = useSession()
  const puedeCrear = !!session?.user?.role && CON_ACCESO_CREACION.includes(session.user.role)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return compras
    const q = search.trim().toLowerCase()
    return compras.filter(
      (c) =>
        c.codigo.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q) ||
        c.proyecto.nombre.toLowerCase().includes(q) ||
        c.creadoPor.name.toLowerCase().includes(q),
    )
  }, [compras, search])

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, proyecto o solicitante…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        {puedeCrear && (
          <Link href="/compras-simples/nueva">
            <Button>
              <Plus className="size-4" />
              Nueva compra simple
            </Button>
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">Sin resultados para &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyecto</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitante</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Grupos</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const resumen = resumenEstado(c)
                const total = c.grupos.reduce((s, g) => s + Number(g.montoTotal), 0)
                return (
                  <tr key={c.id} className="transition-colors duration-120 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/compras-simples/${c.id}`} className="hover:underline underline-offset-4">
                        <span className="flex items-center gap-1.5 font-mono text-sm font-medium tabular-nums">
                          {c.codigo}
                          {c.urgente && <AlertTriangle className="size-3.75 text-amber-500 shrink-0" />}
                        </span>
                        <span className="block text-xs text-muted-foreground">{c.nombre}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TIPO_CLASS[c.tipo])}>
                        {TIPO_LABEL[c.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.proyecto.nombre}</p>
                      {c.proyecto.codigo && (
                        <p className="text-xs text-muted-foreground font-mono">{c.proyecto.codigo}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.creadoPor.name}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{c.grupos.length}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', resumen.className)}>
                        {resumen.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{fmtMoney(String(total))}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono tabular-nums">
                      {fmt(c.creadoEn)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
