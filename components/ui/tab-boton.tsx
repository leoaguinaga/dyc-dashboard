import { cn } from "@/lib/utils";

// Pestaña con subrayado primary, la misma de Pagos y Asistencia. Va dentro de un
// contenedor role="tablist" con borde inferior.
export function TabBoton({
  activo,
  onClick,
  controls,
  id,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  controls?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={activo}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "relative -mb-px flex items-center gap-1.5 px-3 pb-2.5 pt-2 text-sm font-medium transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
        activo
          ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
