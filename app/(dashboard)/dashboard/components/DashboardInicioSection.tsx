import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileText,
  Landmark,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { serverFetch } from "@/lib/api/server";
import type {
  InicioDashboard,
  PrioridadDashboard,
  TareaDashboard,
} from "@/types/api";

const PRIORIDAD: Record<
  PrioridadDashboard,
  { label: string; className: string; icon: typeof CircleAlert }
> = {
  critica: {
    label: "Crítica",
    className: "border-destructive/25 bg-destructive/8 text-destructive",
    icon: CircleAlert,
  },
  alta: {
    label: "Prioridad alta",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    icon: AlertTriangle,
  },
  normal: {
    label: "Pendiente",
    className: "border-primary/20 bg-primary/8 text-primary",
    icon: Clock3,
  },
  informativa: {
    label: "En seguimiento",
    className: "border-border bg-muted text-muted-foreground",
    icon: FileText,
  },
};

const ICONOS_TAREA: Record<string, typeof ClipboardCheck> = {
  requerimiento: ClipboardCheck,
  aprobacion_requerimiento: ClipboardCheck,
  solicitud: FileText,
  cotizacion: FileText,
  compra_simple: ShoppingBag,
  entrega_vencida: ShoppingBag,
  pago: Wallet,
  cobro: Landmark,
  planilla_staff: ReceiptText,
  asistencia: CheckCircle2,
};

function fechaCorta(fecha?: string) {
  if (!fecha) return null;
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
  }).format(new Date(fecha));
}

function TareaFila({
  tarea,
  seguimiento = false,
}: {
  tarea: TareaDashboard;
  seguimiento?: boolean;
}) {
  const prioridad = PRIORIDAD[tarea.prioridad];
  const Icono = ICONOS_TAREA[tarea.tipo] ?? ClipboardCheck;
  const PrioridadIcono = prioridad.icon;
  const fecha = fechaCorta(tarea.fecha);

  return (
    <Link
      href={tarea.href}
      className="group flex items-start gap-3 rounded-lg border border-border/70 bg-card px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icono className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-foreground">{tarea.titulo}</span>
          {!seguimiento && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${prioridad.className}`}
            >
              <PrioridadIcono className="size-3" aria-hidden="true" />
              {prioridad.label}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {tarea.contexto}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 pt-0.5 text-xs text-muted-foreground">
        {fecha && <span className="hidden sm:inline">{fecha}</span>}
        <ArrowRight
          className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

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

  const resumen = [
    {
      label: "Por resolver",
      value: data.resumen.pendientes,
      icon: ClipboardCheck,
      tone: "text-foreground",
    },
    {
      label: "Bloqueos",
      value: data.resumen.bloqueos,
      icon: CircleAlert,
      tone: data.resumen.bloqueos ? "text-destructive" : "text-foreground",
    },
    {
      label: "Próximos",
      value: data.resumen.proximos,
      icon: CalendarClock,
      tone: "text-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {data.usuario.etiquetaRol}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
            Hola, {data.usuario.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este es el trabajo que necesita tu atención.
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border/70 bg-card shadow-sm">
          {resumen.map(({ label, value, icon: Icono, tone }) => (
            <div key={label} className="min-w-24 px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icono className="size-3.5" aria-hidden="true" />
                {label}
              </div>
              <p className={`mt-1 text-xl font-semibold tabular ${tone}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </header>

      <section aria-labelledby="resolver-hoy" className="space-y-3">
        <div>
          <h2 id="resolver-hoy" className="text-base font-semibold">
            Para resolver hoy
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Las tareas están ordenadas por urgencia y dependencia.
          </p>
        </div>
        {data.tareas.length ? (
          <div className="space-y-2">
            {data.tareas.map((tarea) => (
              <TareaFila key={tarea.id} tarea={tarea} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card px-5 py-8 text-center">
            <CheckCircle2
              className="mx-auto size-5 text-primary"
              aria-hidden="true"
            />
            <h3 className="mt-3 font-medium">
              No tienes pendientes operativos
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando algo requiera tu intervención aparecerá aquí.
            </p>
          </div>
        )}
      </section>

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
          {data.seguimiento.length ? (
            <div className="space-y-2">
              {data.seguimiento.map((tarea) => (
                <TareaFila key={tarea.id} tarea={tarea} seguimiento />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No tienes solicitudes activas para seguir.
            </p>
          )}
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
