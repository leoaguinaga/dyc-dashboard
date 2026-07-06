import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Pencil, User2 } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types/api'
import { ContactosSection } from './ContactosSection'
import { Button } from '@/components/ui/button'

export async function ClienteDetail({ id }: { id: string }) {
  const result = await serverFetch<Cliente>(`/clientes/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return (
      <p className="text-sm text-destructive">Error al cargar el cliente.</p>
    )
  }

  const cliente = result

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
            <User2 className="size-5.5 text-muted-foreground" />
          </div>
          <div>
            <div className='flex items-center flex-wrap gap-2'>
              <h1 className="text-2xl font-semibold tracking-tight">
                {cliente.razonSocial}
                {cliente.nombreComercial && (
                  <span className="text-muted-foreground"> ({cliente.nombreComercial})</span>
                )}
              </h1>
              <EstadoBadge activo={cliente.activo} />
            </div>

            {cliente.ruc && (
              <p className="text-sm text-muted-foreground font-mono">
                RUC {cliente.ruc}{cliente.direccion && ` · ${cliente.direccion}`}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/clientes/${id}/editar`}
        >
          <Button
            variant="link"
            className='text-muted-foreground'
          >
            Editar cliente
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <ContactosSection
          clienteId={id}
          contactos={cliente.contactos ?? []}
        />
      </div>

      {/* Proyectos asociados */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Proyectos ({cliente.proyectos?.length ?? 0})
        </h2>

        {!cliente.proyectos?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sin proyectos asociados</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Código', 'Nombre', 'Responsable Asignado', 'Estado', 'Inicio Prog.', 'Fin Prog.'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cliente.proyectos.map((proyecto) => (
                  <tr key={proyecto.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-muted-foreground tabular-nums text-xs">
                      {proyecto.codigo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/proyectos/${proyecto.id}`}
                        className="font-medium hover:underline underline-offset-2"
                      >
                        {proyecto.nombre}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {proyecto.coordinadorEmpresa?.nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoProyectoBadge estado={proyecto.estado} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs font-mono">
                      {proyecto.fechaInicio
                        ? new Date(proyecto.fechaInicio).toLocaleDateString('es-CL')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs font-mono">
                      {proyecto.fechaFin
                        ? new Date(proyecto.fechaFin).toLocaleDateString('es-CL')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
      )}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function EstadoProyectoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    planificacion: 'bg-blue-500/15 text-blue-600',
    ejecucion: 'bg-chart-2/15 text-chart-2',
    cierre: 'bg-amber-500/15 text-amber-600',
    liquidada: 'bg-muted text-muted-foreground',
  }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize', map[estado] ?? 'bg-muted text-muted-foreground')}>
      {estado}
    </span>
  )
}
