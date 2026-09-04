import { Suspense } from "react";
import { DashboardInicioSection } from "./components/DashboardInicioSection";

function DashboardInicioSkeleton() {
  return (
    <div className="space-y-8" aria-label="Cargando inicio">
      <div className="flex items-end justify-between border-b border-border/70 pb-6">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-20 w-72 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-border bg-muted/30"
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardInicioSkeleton />}>
      <DashboardInicioSection />
    </Suspense>
  );
}
