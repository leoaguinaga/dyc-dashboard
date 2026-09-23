import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileText,
  Landmark,
  Lock,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { cn, formatDateOnly } from "@/lib/utils";
import type { PrioridadDashboard, TareaDashboard } from "@/types/api";

const PRIORIDAD: Record<
  PrioridadDashboard,
  { label: string; badge: string; stripe: string; icon: typeof CircleAlert }
> = {
  critica: {
    label: "Crítica",
    badge: "border-destructive/25 bg-destructive/8 text-destructive",
    stripe: "border-l-destructive",
    icon: CircleAlert,
  },
  alta: {
    label: "Prioridad alta",
    badge: "border-chart-3/35 bg-chart-3/12 text-chart-3",
    stripe: "border-l-chart-3",
    icon: AlertTriangle,
  },
  normal: {
    label: "Pendiente",
    badge: "border-primary/20 bg-primary/8 text-primary",
    stripe: "border-l-primary",
    icon: Clock3,
  },
  informativa: {
    label: "En seguimiento",
    badge: "border-border bg-muted text-muted-foreground",
    stripe: "border-l-transparent",
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

/**
 * Lee `fecha` por sus componentes UTC (igual que formatDateOnly) antes de
 * compararla con "hoy" en hora local, para no correr un día en zonas detrás
 * de UTC (America/Lima) cuando el backend guarda la fecha como medianoche UTC.
 */
function diasDesdeHoy(fecha: string): number {
  const f = new Date(fecha);
  const fechaLocal = new Date(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate());
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((fechaLocal.getTime() - hoyLocal.getTime()) / 86_400_000);
}

function fechaRelativa(fecha?: string) {
  if (!fecha) return null;
  const dias = diasDesdeHoy(fecha);
  if (dias === 0) return { texto: "Vence hoy", className: "text-chart-3 font-medium" };
  if (dias < 0) {
    const abs = Math.abs(dias);
    return {
      texto: `Vencido hace ${abs} día${abs === 1 ? "" : "s"}`,
      className: "text-destructive font-medium",
    };
  }
  return { texto: `En ${dias} día${dias === 1 ? "" : "s"}`, className: "text-muted-foreground" };
}

interface TareaRowProps {
  tarea: TareaDashboard;
  seguimiento?: boolean;
}

export function TareaRow({ tarea, seguimiento = false }: TareaRowProps) {
  const prioridad = PRIORIDAD[tarea.prioridad];
  const Icono = ICONOS_TAREA[tarea.tipo] ?? ClipboardCheck;
  const PrioridadIcono = prioridad.icon;
  const fecha = seguimiento
    ? tarea.fecha
      ? { texto: formatDateOnly(tarea.fecha, { day: "numeric", month: "short" }), className: "text-muted-foreground" }
      : null
    : fechaRelativa(tarea.fecha);

  return (
    <Link
      href={tarea.href}
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-border/70 border-l-2 bg-card px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        seguimiento ? "border-l-transparent" : prioridad.stripe,
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icono className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-foreground">{tarea.titulo}</span>
          {!seguimiento && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                prioridad.badge,
              )}
            >
              <PrioridadIcono className="size-3" aria-hidden="true" />
              {prioridad.label}
            </span>
          )}
          {!seguimiento && tarea.bloqueada && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Lock className="size-3" aria-hidden="true" />
              Bloqueada
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {tarea.contexto}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 pt-0.5 text-xs">
        {fecha && <span className={cn("hidden sm:inline", fecha.className)}>{fecha.texto}</span>}
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
