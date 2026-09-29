'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { abrirTurnoDeObra, accionDe, estadoDe, type AccionObra, type EstadoObra } from './obra-hoy'
import type { ObraHoy, ObrasHoyResponse } from '@/types/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ObrasHoyResponse | null
  loading: boolean
  error: string | null
}

const GRUPOS: { estado: EstadoObra; titulo: string }[] = [
  { estado: 'en_curso', titulo: 'En curso' },
  { estado: 'sin_abrir', titulo: 'Sin abrir' },
  { estado: 'cerrada', titulo: 'Cerradas hoy' },
  { estado: 'sin_horario', titulo: 'No disponibles' },
]

const ETIQUETA_ESTADO: Record<EstadoObra, string> = {
  en_curso: 'Continuar',
  sin_abrir: 'Abrir',
  cerrada: 'Ver jornada',
  sin_horario: 'Sin horario',
}

interface Fila {
  obra: ObraHoy
  estado: EstadoObra
  accion: AccionObra | null
}

function normalizar(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function MarcarAsistenciaDialog({ open, onOpenChange, data, loading, error }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role
  const esPdr = role === 'pdr'
  const puedeConfigurar = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'

  const [consulta, setConsulta] = useState('')
  const [activo, setActivo] = useState(0)
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const grupos = useMemo(() => {
    const q = normalizar(consulta.trim())
    const filas: Fila[] = (data?.obras ?? [])
      .filter((o) => !q || normalizar(o.nombre).includes(q) || normalizar(o.codigo ?? '').includes(q))
      .map((obra) => {
        const estado = estadoDe(obra)
        return { obra, estado, accion: accionDe(obra, estado, { esPdr, puedeConfigurar }) }
      })
    return GRUPOS.map((g) => ({ ...g, filas: filas.filter((f) => f.estado === g.estado) })).filter((g) => g.filas.length > 0)
  }, [data, consulta, esPdr, puedeConfigurar])

  // Solo se puede activar una fila que tenga acción; el resto se muestra pero no entra en el teclado.
  const activables = useMemo(() => grupos.flatMap((g) => g.filas).filter((f) => f.accion), [grupos])

  function cerrar(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setConsulta('')
      setActivo(0)
      setErrorAccion(null)
    }
  }

  async function ejecutar(fila: Fila) {
    const { obra, accion } = fila
    if (!accion) return
    setErrorAccion(null)
    if (accion.abrir) {
      setTrabajando(obra.proyectoId)
      try {
        await abrirTurnoDeObra(obra)
        router.push(`/asistencia/turno/${obra.proyectoId}`)
        cerrar(false)
      } catch (err) {
        setErrorAccion(err instanceof Error ? err.message : 'No se pudo abrir el turno')
      } finally {
        setTrabajando(null)
      }
      return
    }
    if (accion.href) {
      router.push(accion.href)
      cerrar(false)
    }
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (activables.length === 0) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const paso = e.key === 'ArrowDown' ? 1 : -1
      const siguiente = (activo + paso + activables.length) % activables.length
      setActivo(siguiente)
      requestAnimationFrame(() => {
        listaRef.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const fila = activables[Math.min(activo, activables.length - 1)]
      if (fila) void ejecutar(fila)
    }
  }

  const idActivo = activables[Math.min(activo, activables.length - 1)]?.obra.proyectoId

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="gap-3 p-0 sm:max-w-md">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Marcar asistencia de hoy</DialogTitle>
          <DialogDescription>Elige la obra. Continuarás el turno abierto o abrirás uno nuevo.</DialogDescription>
        </DialogHeader>

        <div className="mx-4 flex items-center gap-2 rounded-lg border border-input px-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="lista-obras-asistencia"
            aria-activedescendant={idActivo ? `obra-op-${idActivo}` : undefined}
            aria-label="Buscar obra por nombre o código"
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value)
              setActivo(0)
            }}
            onKeyDown={alTeclear}
            placeholder="Buscar por nombre o código"
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div
          ref={listaRef}
          id="lista-obras-asistencia"
          role="listbox"
          aria-label="Obras"
          className="max-h-[50vh] overflow-y-auto pb-1"
        >
          {loading && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Cargando obras...</p>}
          {error && <p role="alert" className="px-4 py-3 text-sm text-destructive">{error}</p>}
          {!loading && !error && grupos.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {consulta ? 'Ninguna obra coincide con la búsqueda.' : 'No hay obras disponibles.'}
            </p>
          )}
          {grupos.map((g) => (
            <div key={g.estado} role="group" aria-label={g.titulo}>
              <p className="px-4 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{g.titulo}</p>
              {g.filas.map((f) => {
                const esActivo = f.obra.proyectoId === idActivo
                const deshabilitada = !f.accion
                return (
                  <button
                    key={f.obra.proyectoId}
                    id={`obra-op-${f.obra.proyectoId}`}
                    type="button"
                    role="option"
                    aria-selected={esActivo}
                    aria-disabled={deshabilitada}
                    data-activo={esActivo}
                    disabled={trabajando !== null}
                    onMouseMove={() => {
                      const i = activables.findIndex((a) => a.obra.proyectoId === f.obra.proyectoId)
                      if (i >= 0) setActivo(i)
                    }}
                    onClick={() => void ejecutar(f)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors duration-[120ms] disabled:opacity-60 ${esActivo ? 'bg-muted' : ''} ${deshabilitada ? 'cursor-default' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{f.obra.nombre}</span>
                      {f.obra.codigo && <span className="block font-mono text-xs text-muted-foreground">{f.obra.codigo}</span>}
                    </span>
                    <span className={`shrink-0 text-xs font-medium ${f.estado === 'sin_horario' ? 'text-amber-700' : 'text-primary'}`}>
                      {trabajando === f.obra.proyectoId ? 'Abriendo...' : f.accion ? f.accion.label === 'Configurar horario' ? 'Configurar horario ›' : `${ETIQUETA_ESTADO[f.estado]} ›` : ETIQUETA_ESTADO[f.estado]}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {errorAccion && <p role="alert" className="px-4 text-sm text-destructive">{errorAccion}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>↑ ↓ para moverse · Enter para entrar</span>
          <span>Esc cierra</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
