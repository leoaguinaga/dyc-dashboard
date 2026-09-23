import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { serverFetch } from "@/lib/api/server";
import type { InicioDashboard } from "@/types/api";
import { TareasHoyPanel } from "./TareasHoyPanel";
import { SeguimientoPanel } from "./SeguimientoPanel";

export async function DashboardInicioSection() {
  const data = await serverFetch<InicioDashboard>("/dashboard/inicio").catch(
    () => null,
  );

  if (!data) {
    return (
      <section className="rounded-xl border border-destructive/30 bg-card p-6">
        <h1 className="text-lg font-semibold">No pudimos cargar tu inicio</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Vuelve a intentarlo. Si el problema continúa, revisa tu conexión o
          contacta a administración.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Reintentar <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-border/70 pb-6">
        <p className="text-sm font-medium text-muted-foreground">
          {data.usuario.etiquetaRol}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
          Hola, {data.usuario.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Este es el trabajo que necesita tu atención.
        </p>
      </header>

      <TareasHoyPanel tareas={data.tareas} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section aria-labelledby="seguimiento" className="space-y-3">
          <div>
            <h2 id="seguimiento" className="text-base font-semibold">
              Mis solicitudes en seguimiento
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta el estado sin perder el contexto de tu requerimiento.
            </p>
          </div>
          <SeguimientoPanel seguimiento={data.seguimiento} />
        </section>

        <section aria-labelledby="accesos-rapidos" className="space-y-3">
          <div>
            <h2 id="accesos-rapidos" className="text-base font-semibold">
              Accesos rápidos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acciones frecuentes para tu rol.
            </p>
          </div>
          <div className="space-y-2">
            {data.accionesRapidas.map((accion) => (
              <Link
                key={accion.id}
                href={accion.href}
                className="group block rounded-lg border border-border/70 bg-card p-4 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center justify-between gap-3 font-medium text-foreground">
                  {accion.titulo}
                  <ArrowRight
                    className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {accion.descripcion}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
