"use client";

import { useState } from "react";
import type { TareaDashboard } from "@/types/api";
import { TareaRow } from "./TareaRow";
import { Pager } from "./Pager";

const PER_PAGE = 5;

export function SeguimientoPanel({ seguimiento }: { seguimiento: TareaDashboard[] }) {
  const [page, setPage] = useState(1);

  if (!seguimiento.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        No tienes solicitudes activas para seguir.
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(seguimiento.length / PER_PAGE));
  const paginaSegura = Math.min(page, totalPages);
  const visibles = seguimiento.slice((paginaSegura - 1) * PER_PAGE, paginaSegura * PER_PAGE);

  return (
    <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      {visibles.map((tarea) => (
        <TareaRow key={tarea.id} tarea={tarea} seguimiento />
      ))}
      <Pager page={paginaSegura} totalItems={seguimiento.length} perPage={PER_PAGE} onPageChange={setPage} />
    </div>
  );
}
