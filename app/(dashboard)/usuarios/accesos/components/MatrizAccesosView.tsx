'use client'

import { useMemo, useRef, useState } from 'react'
import { Eye, Minus, Pencil } from 'lucide-react'
import { api } from '@/lib/api/client'
import { ROLE_LABELS } from '@/lib/roles'
import { NIVEL_LABELS } from '@/lib/accesos'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { MatrizAccesos, ModuloKey, NivelAcceso, Role } from '@/types/api'

interface Props {
  initial: MatrizAccesos
  editable: boolean
}

/** Agrupación de la matriz: mismas áreas que el menú lateral. */
const AREAS: { label: string; modulos: ModuloKey[] }[] = [
  { label: 'Obras', modulos: ['proyectos', 'asistencia'] },
  { label: 'Abastecimiento', modulos: ['solicitudes', 'cotizaciones', 'ordenes', 'almacenes', 'proveedores'] },
  { label: 'Finanzas', modulos: ['pagos', 'cobros', 'planilla'] },
  { label: 'Directorio', modulos: ['clientes', 'trabajadores'] },
  { label: 'Control y sistema', modulos: ['reportes', 'usuarios'] },
]

const FAMILIAS: { label: string; roles: Role[] }[] = [
  { label: 'Gestión', roles: ['administrador', 'gerencia', 'logistica', 'tesoreria'] },
  { label: 'Obra', roles: ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'ing_civil', 'ing_electrico'] },
  { label: 'Seguridad', roles: ['pdr', 'jefe_sig', 'coordinador_ssoma'] },
]

const ROLE_CORTO: Partial<Record<Role, string>> = {
  administrador: 'Admin.',
  supervisor_civil: 'Sup. Civil',
  supervisor_electrico: 'Sup. Eléctrico',
  pdr: 'PDR',
  coordinador_ssoma: 'Coord. SSOMA',
}

const ICONOS = { editar: Pencil, ver: Eye, ninguno: Minus } as const
const NIVELES: NivelAcceso[] = ['ninguno', 'ver', 'editar']
const DESCRIPCION: Record<NivelAcceso, string> = {
  ninguno: 'Oculta el módulo',
  ver: 'Solo consultar',
  editar: 'Crear, modificar y aprobar',
}

/** null = volver a lo que define el sistema. */
type Pendiente = NivelAcceso | null

const clave = (modulo: ModuloKey, role: Role) => `${modulo}:${role}`

function Glifo({ nivel, parcial, excepcion, pendiente, className }: {
  nivel: NivelAcceso
  parcial: boolean
  excepcion: boolean
  pendiente: boolean
  className?: string
}) {
  const Icono = ICONOS[nivel]
  return (
    <span
      className={cn(
        'relative inline-grid h-7 w-11 place-items-center rounded-md border border-transparent',
        nivel === 'editar' && 'bg-foreground/10 text-foreground',
        nivel === 'ver' && 'border-foreground/10 bg-foreground/[0.04] text-foreground/70',
        nivel === 'ninguno' && 'text-muted-foreground/60',
        excepcion && 'border-primary bg-primary/10 text-primary',
        pendiente && 'border-dashed border-primary bg-card text-primary',
        className,
      )}
    >
      <Icono className="size-3.5" aria-hidden />
      {parcial && !excepcion && !pendiente && (
        <span
          aria-hidden
          className="absolute right-0.5 bottom-0.5 size-1.5 bg-current opacity-50 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
        />
      )}
      {(excepcion || pendiente) && (
        <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-card" />
      )}
    </span>
  )
}

export function MatrizAccesosView({ initial, editable }: Props) {
  const [matriz, setMatriz] = useState(initial)
  const [pendientes, setPendientes] = useState<Record<string, Pendiente>>({})
  const [soloExcepciones, setSoloExcepciones] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const celdas = useMemo(() => {
    const m = new Map<string, MatrizAccesos['celdas'][number]>()
    matriz.celdas.forEach((c) => m.set(clave(c.modulo, c.role), c))
    return m
  }, [matriz])

  const etiquetaModulo = useMemo(
    () => new Map(matriz.modulos.map((m) => [m.key, m.label])),
    [matriz.modulos],
  )

  const roles = useMemo(() => {
    const ordenados: Role[] = FAMILIAS.flatMap((f) => f.roles).filter((r) => matriz.roles.includes(r))
    const resto = matriz.roles.filter((r) => !ordenados.includes(r))
    return [...ordenados, ...resto]
  }, [matriz.roles])

  const familias = useMemo(() => {
    const fs = FAMILIAS.map((f) => ({ label: f.label, roles: f.roles.filter((r) => roles.includes(r)) })).filter(
      (f) => f.roles.length > 0,
    )
    const resto = roles.filter((r) => !FAMILIAS.some((f) => f.roles.includes(r)))
    if (resto.length) fs.push({ label: 'Otros', roles: resto })
    return fs
  }, [roles])

  const areas = useMemo(
    () =>
      AREAS.map((a) => ({ ...a, modulos: a.modulos.filter((k) => etiquetaModulo.has(k)) })).filter(
        (a) => a.modulos.length > 0,
      ),
    [etiquetaModulo],
  )

  function efectivo(modulo: ModuloKey, role: Role) {
    const c = celdas.get(clave(modulo, role))!
    const k = clave(modulo, role)
    const hayPendiente = k in pendientes
    const excepcion = hayPendiente ? pendientes[k] : c.excepcion
    if (excepcion !== null) {
      return { nivel: excepcion, parcial: false, excepcion: true, pendiente: hayPendiente, sistema: c.porDefecto }
    }
    return {
      nivel: c.porDefecto.nivel,
      parcial: c.porDefecto.parcial,
      excepcion: false,
      pendiente: hayPendiente,
      sistema: c.porDefecto,
    }
  }

  const totalExcepciones = matriz.celdas.filter((c) => {
    const k = clave(c.modulo, c.role)
    return k in pendientes ? pendientes[k] !== null : c.excepcion !== null
  }).length

  const filasVisibles = (modulos: ModuloKey[]) =>
    soloExcepciones ? modulos.filter((m) => roles.some((r) => efectivo(m, r).excepcion)) : modulos

  function fijar(modulo: ModuloKey, role: Role, valor: Pendiente) {
    if (!editable) return
    const k = clave(modulo, role)
    const base = celdas.get(k)!.excepcion
    setPendientes((p) => {
      const sig = { ...p }
      if (valor === base) delete sig[k]
      else sig[k] = valor
      return sig
    })
    setAviso(null)
  }

  async function aplicar() {
    setAplicando(true)
    setError(null)
    const cola = Object.entries(pendientes)
    let hechos = 0
    try {
      for (const [k, nivel] of cola) {
        const [modulo, role] = k.split(':') as [ModuloKey, Role]
        const nueva = await api.put<MatrizAccesos>(`/rbac/modulos/${modulo}/roles/${role}`, { nivel })
        setMatriz(nueva)
        setPendientes((p) => {
          const sig = { ...p }
          delete sig[k]
          return sig
        })
        hechos++
      }
      setAviso(
        `${hechos} ${hechos === 1 ? 'cambio aplicado' : 'cambios aplicados'}. Se verán en menos de un minuto; el menú de cada persona se actualiza al recargar.`,
      )
    } catch (err) {
      setError(
        `${err instanceof Error ? err.message : 'No se pudo guardar'}. ${hechos} de ${cola.length} cambios se aplicaron; los demás siguen pendientes.`,
      )
    } finally {
      setAplicando(false)
    }
  }

  function moverFoco(modulo: ModuloKey, role: Role, dx: number, dy: number) {
    const filas = areas.flatMap((a) => filasVisibles(a.modulos))
    const fi = Math.max(0, Math.min(filas.length - 1, filas.indexOf(modulo) + dy))
    const ci = Math.max(0, Math.min(roles.length - 1, roles.indexOf(role) + dx))
    refs.current[clave(filas[fi], roles[ci])]?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent, modulo: ModuloKey, role: Role) {
    const flechas: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }
    if (e.key in flechas) {
      e.preventDefault()
      moverFoco(modulo, role, ...flechas[e.key])
    } else if (editable && (e.key === '0' || e.key === '1' || e.key === '2')) {
      e.preventDefault()
      fijar(modulo, role, NIVELES[Number(e.key)])
    } else if (editable && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault()
      fijar(modulo, role, null)
    }
  }

  const primera = areas.flatMap((a) => filasVisibles(a.modulos))[0]
  const nPend = Object.keys(pendientes).length

  const resumen = Object.entries(pendientes)
    .slice(0, 3)
    .map(([k, v]) => {
      const [modulo, role] = k.split(':') as [ModuloKey, Role]
      const antes = efectivoSinPend(modulo, role)
      const despues = v === null ? `sistema (${NIVEL_LABELS[celdas.get(k)!.porDefecto.nivel]})` : NIVEL_LABELS[v]
      return `${ROLE_LABELS[role]} · ${etiquetaModulo.get(modulo)}: ${antes} → ${despues}`
    })
    .join(' · ')

  function efectivoSinPend(modulo: ModuloKey, role: Role) {
    const c = celdas.get(clave(modulo, role))!
    return NIVEL_LABELS[c.excepcion ?? c.porDefecto.nivel]
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filtro de filas"
          className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5 text-[13px]"
        >
          {[
            { v: false, t: 'Todos los módulos' },
            { v: true, t: `Solo excepciones` },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              aria-pressed={soloExcepciones === o.v}
              onClick={() => setSoloExcepciones(o.v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground',
                soloExcepciones === o.v && 'bg-card text-foreground shadow-xs ring-1 ring-foreground/10',
              )}
            >
              {o.t}
              {o.v && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] leading-4 font-semibold text-primary-foreground tabular-nums">
                  {totalExcepciones}
                </span>
              )}
            </button>
          ))}
        </div>
        {!editable && <p className="text-[13px] text-muted-foreground">Solo el área de TI puede cambiar estos accesos.</p>}
      </div>

      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground" aria-label="Leyenda">
        {NIVELES.slice()
          .reverse()
          .map((n) => (
            <li key={n} className="flex items-center gap-2">
              <Glifo nivel={n} parcial={false} excepcion={false} pendiente={false} />
              {NIVEL_LABELS[n]}
            </li>
          ))}
        <li className="flex items-center gap-2">
          <Glifo nivel="editar" parcial excepcion={false} pendiente={false} />
          Parcial: solo algunas acciones
        </li>
        <li className="flex items-center gap-2">
          <Glifo nivel="editar" parcial={false} excepcion pendiente={false} />
          Excepción de TI
        </li>
      </ul>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="relative w-full max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-border bg-card">
        <table className="w-full min-w-[60rem] table-fixed border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky top-0 left-0 z-20 w-56 border-b border-border bg-card px-3.5 text-left align-bottom text-[13px] font-semibold"
              >
                <span className="block pb-2.5">Módulo</span>
              </th>
              {familias.map((f) => (
                <th
                  key={f.label}
                  colSpan={f.roles.length}
                  className="h-7 border-l border-border/60 bg-card pl-2.5 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {f.label}
                </th>
              ))}
            </tr>
            <tr>
              {roles.map((r) => (
                <th
                  key={r}
                  scope="col"
                  title={ROLE_LABELS[r]}
                  className="h-10 border-b border-border bg-card px-1 text-center text-xs leading-tight font-medium text-muted-foreground"
                >
                  {ROLE_CORTO[r] ?? ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => {
              const mods = filasVisibles(a.modulos)
              if (mods.length === 0) return null
              return [
                <tr key={a.label}>
                  <th
                    colSpan={roles.length + 1}
                    scope="rowgroup"
                    className="sticky left-0 h-7 border-b border-border/60 bg-background px-3.5 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {a.label}
                  </th>
                </tr>,
                ...mods.map((m) => (
                  <tr key={m} className="group/fila">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 truncate border-b border-border/60 bg-card px-3.5 text-left font-medium group-hover/fila:text-primary"
                    >
                      {etiquetaModulo.get(m)}
                    </th>
                    {roles.map((r) => {
                      const e = efectivo(m, r)
                      const k = clave(m, r)
                      const desc = `${NIVEL_LABELS[e.nivel]}${e.parcial ? ' (parcial)' : ''}`
                      const label = `${etiquetaModulo.get(m)} para ${ROLE_LABELS[r]}: ${desc}, ${
                        e.excepcion ? 'excepción' : 'definido por el sistema'
                      }${e.pendiente ? ', cambio pendiente' : ''}`
                      const actual: string = k in pendientes ? (pendientes[k] ?? 'sistema') : (celdas.get(k)!.excepcion ?? 'sistema')
                      return (
                        <td key={r} className="h-10 border-b border-border/60 p-0 text-center">
                          <Popover open={abierta === k} onOpenChange={(o) => setAbierta(o ? k : null)}>
                            <PopoverTrigger
                              ref={(el: HTMLButtonElement | null) => {
                                refs.current[k] = el
                              }}
                              disabled={!editable}
                              aria-label={label}
                              tabIndex={m === primera && r === roles[0] ? 0 : -1}
                              onKeyDown={(ev: React.KeyboardEvent) => onKeyDown(ev, m, r)}
                              onFocus={(ev: React.FocusEvent<HTMLButtonElement>) => {
                                Object.values(refs.current).forEach((b) => b && (b.tabIndex = -1))
                                ev.currentTarget.tabIndex = 0
                              }}
                              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default"
                            >
                              <Glifo nivel={e.nivel} parcial={e.parcial} excepcion={e.excepcion} pendiente={e.pendiente} />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 gap-1 p-1.5">
                              <div className="px-2 pt-1 pb-1.5">
                                <p className="text-[13px] font-semibold">{etiquetaModulo.get(m)}</p>
                                <p className="text-xs text-muted-foreground">{ROLE_LABELS[r]}</p>
                              </div>
                              {(['sistema', ...NIVELES] as const).map((op) => {
                                const sist = celdas.get(k)!.porDefecto
                                const titulo = op === 'sistema' ? 'Como el sistema' : NIVEL_LABELS[op]
                                const sub =
                                  op === 'sistema'
                                    ? `${NIVEL_LABELS[sist.nivel]}${sist.parcial ? ' (parcial)' : ''}`
                                    : DESCRIPCION[op]
                                return (
                                  <button
                                    key={op}
                                    type="button"
                                    role="radio"
                                    aria-checked={actual === op}
                                    onClick={() => {
                                      fijar(m, r, op === 'sistema' ? null : op)
                                      setAbierta(null)
                                      refs.current[k]?.focus()
                                    }}
                                    className="flex items-start gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                                  >
                                    <span
                                      className={cn(
                                        'mt-0.5 size-3.5 shrink-0 rounded-full border-[1.5px] border-foreground/30',
                                        actual === op && 'border-primary bg-primary shadow-[inset_0_0_0_3px_var(--card)]',
                                      )}
                                    />
                                    <span className="flex flex-col">
                                      <span className="text-[13px] font-medium">{titulo}</span>
                                      <span className="text-xs text-muted-foreground">{sub}</span>
                                    </span>
                                  </button>
                                )
                              })}
                            </PopoverContent>
                          </Popover>
                        </td>
                      )
                    })}
                  </tr>
                )),
              ]
            })}
            {soloExcepciones && totalExcepciones === 0 && (
              <tr>
                <td colSpan={roles.length + 1} className="h-20 text-center text-muted-foreground">
                  Sin excepciones: todos los roles usan el acceso que define el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Flechas para moverte · <kbd className="font-mono">0</kbd> <kbd className="font-mono">1</kbd>{' '}
        <kbd className="font-mono">2</kbd> fijan Sin acceso, Ver o Editar · <kbd className="font-mono">⌫</kbd> vuelve a lo del
        sistema. Admin TI siempre tiene acceso total. &quot;Editar&quot; incluye crear, modificar y aprobar; las reglas propias de
        cada flujo se siguen aplicando.
      </p>

      <div aria-live="polite" className="min-h-5 text-[13px] text-muted-foreground">
        {aviso}
      </div>

      {nPend > 0 && (
        <div
          role="region"
          aria-label="Cambios pendientes"
          className="sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-foreground px-4 py-2.5 text-background shadow-lg"
        >
          <div className="min-w-0 text-[13px]">
            <p className="font-medium">
              {nPend} {nPend === 1 ? 'cambio pendiente' : 'cambios pendientes'}
            </p>
            <p className="text-xs opacity-75">
              {resumen}
              {nPend > 3 && ` · +${nPend - 3} más`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={aplicando} onClick={() => setPendientes({})} className="text-background hover:bg-background/10 hover:text-background">
              Descartar
            </Button>
            <Button size="sm" disabled={aplicando} onClick={aplicar}>
              {aplicando ? 'Aplicando…' : 'Aplicar cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
