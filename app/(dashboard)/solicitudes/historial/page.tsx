import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { serverFetch } from "@/lib/api/server";
import { cn } from "@/lib/utils";
import type { SolicitudResumen, SolicitudesResponse } from "@/types/api";

const ORIGEN_LABEL = {
  macro: "Macro",
  precotizado: "Precotizada",
} as const;

const ESTADO_LABEL: Record<string, string> = {
  recibido: "Recibido",
  recibida: "Recibida",
  cancelado: "Cancelado",
  cancelada: "Cancelada",
  grupos_mixtos: "Grupos cerrados",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function EstadoTerminal({ solicitud }: { solicitud: SolicitudResumen }) {
  const cancelada = solicitud.etapa === "cancelada";
  const label =
    ESTADO_LABEL[solicitud.estadoNativo] ??
    (cancelada ? "Cancelada" : "Recibida");

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        cancelada
          ? "bg-destructive/10 text-destructive"
          : "bg-emerald-500/10 text-emerald-800",
      )}
    >
      {label}
    </span>
  );
}

export default async function SolicitudesHistorialPage() {
  const result = await serverFetch<SolicitudesResponse>(
    "/solicitudes?vista=historial&limit=100",
  ).catch((error: Error) => error);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Historial de solicitudes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solicitudes recibidas o canceladas que ya no requieren seguimiento
            operativo.
          </p>
        </div>
        <Link
          href="/solicitudes"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeft className="size-4" />
          Volver a solicitudes
        </Link>
      </div>

      {result instanceof Error ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <Clock className="mx-auto size-9 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">
            No se pudo cargar el historial
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vuelve a intentarlo en unos minutos.
          </p>
        </div>
      ) : result.data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <Clock className="mx-auto size-9 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">
            Aún no hay solicitudes cerradas
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las solicitudes recibidas o canceladas aparecerán aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {result.data.map((solicitud) => (
              <Link
                key={solicitud.id}
                href={solicitud.hrefDetalle}
                className="rounded-lg border border-border bg-card p-3 transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium tabular-nums">
                      {solicitud.codigo}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {solicitud.nombre}
                    </p>
                  </div>
                  <EstadoTerminal solicitud={solicitud} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="truncate">{solicitud.proyecto.nombre}</span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {formatDate(solicitud.creadoEn)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Solicitud
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Origen
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Proyecto
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Solicitante
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((solicitud) => (
                  <tr
                    key={solicitud.id}
                    className="transition-colors duration-[120ms] hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={solicitud.hrefDetalle}
                        className="font-medium hover:underline hover:underline-offset-4"
                      >
                        <span className="font-mono tabular-nums">
                          {solicitud.codigo}
                        </span>
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {solicitud.nombre}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ORIGEN_LABEL[solicitud.origen]}
                    </td>
                    <td className="px-4 py-3">{solicitud.proyecto.nombre}</td>
                    <td className="px-4 py-3">
                      <EstadoTerminal solicitud={solicitud} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {solicitud.creadoPor.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDate(solicitud.creadoEn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
