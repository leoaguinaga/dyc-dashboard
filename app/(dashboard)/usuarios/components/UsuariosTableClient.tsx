'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Role, User } from '@/types/api'

const ROLE_LABELS: Record<Role, string> = {
  administrador:        'TI',
  gerencia:             'Gerencia',
  logistica:            'Logística',
  supervisor:           'Supervisor',
  supervisor_civil:     'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr:                  'PDR (Seguridad)',
  ing_civil:            'Ing. Civil',
  ing_electrico:        'Ing. Eléctrico',
  jefe_sig:             'Jefe SIG',
}

const ROLE_COLORS: Record<Role, string> = {
  administrador:        'bg-primary/10 text-primary',
  gerencia:             'bg-chart-1/15 text-chart-1',
  logistica:            'bg-chart-2/15 text-chart-2',
  supervisor:           'bg-muted text-muted-foreground',
  supervisor_civil:     'bg-blue-500/10 text-blue-600',
  supervisor_electrico: 'bg-amber-500/10 text-amber-600',
  pdr:                  'bg-orange-500/10 text-orange-600',
  ing_civil:            'bg-blue-500/10 text-blue-600',
  ing_electrico:        'bg-amber-500/10 text-amber-600',
  jefe_sig:             'bg-orange-500/10 text-orange-600',
}

interface Props {
  usuarios: User[]
}

export function UsuariosTableClient({ usuarios }: Props) {
  const [search, setSearch] = useState('')
  const [rol, setRol] = useState<Role | 'todos'>('todos')

  const filtered = useMemo(() => {
    let result = usuarios

    if (rol !== 'todos') result = result.filter((u) => u.role === rol)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }

    return result
  }, [usuarios, rol, search])

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={rol} onValueChange={(v) => setRol(v as Role | 'todos')}>
          <SelectTrigger>
            <p>Rol</p>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            <SelectItem value="administrador">TI</SelectItem>
            <SelectItem value="gerencia">Gerencia</SelectItem>
            <SelectItem value="logistica">Logística</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="ing_civil">Ing. Civil</SelectItem>
            <SelectItem value="ing_electrico">Ing. Eléctrico</SelectItem>
            <SelectItem value="jefe_sig">Jefe SIG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? `Sin resultados para "${search}"`
              : 'No hay usuarios con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Rol</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Desde</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                      ROLE_COLORS[u.role],
                    )}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {new Date(u.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/usuarios/${u.id}/editar`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
