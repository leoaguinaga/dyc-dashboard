"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TareaDashboard } from "@/types/api";
import { TareaRow } from "./TareaRow";
import { Pager } from "./Pager";

const PER_PAGE = 5;

type Filtro = "todas" | "bloqueadas" | "proximos";

const FILTRO_LABEL: Record<Filtro, string> = {
  todas: "Todas",
  bloqueadas: "Bloqueadas",
  proximos: "Próximos",
};

export function TareasHoyPanel({ tareas }: { tareas: TareaDashboard[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      todas: tareas.length,
      bloqueadas: tareas.filter((t) => t.bloqueada).length,
      proximos: tareas.filter((t) => t.proxima).length,
    }),
    [tareas],
  );

  const filtradas = useMemo(() => {
    if (filtro === "bloqueadas") return tareas.filter((t) => t.bloqueada);
    if (filtro === "proximos") return tareas.filter((t) => t.proxima);
    return tareas;
  }, [tareas, filtro]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PER_PAGE));
  const paginaSegura = Math.min(page, totalPages);
  const visibles = filtradas.slice((paginaSegura - 1) * PER_PAGE, paginaSegura * PER_PAGE);

  function cambiarFiltro(next: Filtro) {
    setFiltro(next);
    setPage(1);
  }

  const resumenItems: { key: Filtro; label: string; icon: typeof ClipboardCheck; tone: string }[] = [
    { key: "todas", label: "Por resolver", icon: ClipboardCheck, tone: "" },
    { key: "bloqueadas", label: "Bloqueos", icon: CircleAlert, tone: counts.bloqueadas ? "text-destructive" : "" },
    { key: "proximos", label: "Próximos", icon: CalendarClock, tone: "text-primary" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        {resumenItems.map(({ key, label, icon: Icono, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => cambiarFiltro(key)}
            aria-pressed={filtro === key}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filtro === key && "border-primary ring-1 ring-primary",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icono className="size-3.5" aria-hidden="true" />
              {label}
            </span>
            <span className={cn("text-xl font-semibold tabular-nums text-foreground", tone)}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <section aria-labelledby="resolver-hoy" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="resolver-hoy" className="text-base font-semibold">
              Para resolver hoy
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ordenadas por urgencia y días de vencimiento.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(FILTRO_LABEL) as Filtro[]).map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cambiarFiltro(key)}
                aria-pressed={filtro === key}
                className={cn(
                  "rounded-full",
                  filtro === key &&
                    "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background",
                )}
              >
                {FILTRO_LABEL[key]}
                <span className="text-[10px] opacity-70">{counts[key]}</span>
              </Button>
            ))}
          </div>
        </div>

        {visibles.length ? (
          <div className="space-y-2">
            {visibles.map((tarea) => (
              <TareaRow key={tarea.id} tarea={tarea} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card px-5 py-8 text-center">
            <CheckCircle2 className="mx-auto size-5 text-chart-2" aria-hidden="true" />
            <h3 className="mt-3 font-medium">
              {filtro === "todas" ? "No tienes pendientes operativos" : "No hay tareas en este filtro"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtro === "todas"
                ? "Cuando algo requiera tu intervención aparecerá aquí."
                : "Prueba con otro filtro."}
            </p>
          </div>
        )}

        <Pager page={paginaSegura} totalItems={filtradas.length} perPage={PER_PAGE} onPageChange={setPage} />
      </section>
    </div>
  );
}
