'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { DataTable } from '@/components/shared/data-table/data-table'
import type { Role, User } from '@/types/api'
import { columns, ROLE_LABELS } from './columns'

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
    <DataTable
      columns={columns}
      data={filtered}
      emptyMessage={
        search.trim() ? `Sin resultados para "${search}"` : 'No hay usuarios con los filtros seleccionados'
      }
      toolbar={
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
              {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    />
  )
}
