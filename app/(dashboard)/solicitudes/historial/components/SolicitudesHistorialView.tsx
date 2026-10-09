"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronsUp,
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Paperclip,
  Search,
  X,
  Zap,
} from "lucide-react";
import { TabBoton } from "@/components/ui/tab-boton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtMoney } from "@/lib/pagos-utils";
import { cn } from "@/lib/utils";
import type {
  FlujoMacroSolicitud,
  FlujoPrecotizadoSolicitud,
  PrioridadRequerimiento,
  SolicitudResumen,
  TipoRequerimiento,
} from "@/types/api";

type Tab = "macro" | "precotizadas";
type EstadoFiltro = "todos" | "recibido" | "cancelado";

interface Props {
  macro: SolicitudResumen[] | null;
  precotizadas: SolicitudResumen[] | null;
  tabInicial: Tab;
}

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: "Civil",
  electrico: "Eléctrico",
  seguridad: "Seguridad",
  administrativo: "Administrativo",
};

const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: "bg-blue-500/10 text-blue-700",
  electrico: "bg-amber-500/15 text-amber-800",
  seguridad: "bg-orange-500/10 text-orange-800",
  administrativo: "bg-purple-500/10 text-purple-700",
};

const DIA_MS = 86_400_000;
const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "set", "oct", "nov", "dic",
];

function fmtDia(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`;
}

function diasEntre(desde: string, hasta: string) {
  return Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / DIA_MS);
}

function lunesDe(iso: string) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function etiquetaSemana(lunes: Date) {
  const actual = lunesDe(new Date().toISOString());
  if (lunes.getTime() === actual.getTime()) return "Esta semana";
  return `Semana del ${fmtDia(lunes.toISOString())}`;
}

function agruparPorSemana<T extends { fecha: string }>(filas: T[]) {
  const grupos = new Map<number, { lunes: Date; filas: T[] }>();
  for (const fila of filas) {
    const lunes = lunesDe(fila.fecha);
    const clave = lunes.getTime();
    const grupo = grupos.get(clave) ?? { lunes, filas: [] };
    grupo.filas.push(fila);
    grupos.set(clave, grupo);
  }
  return [...grupos.values()].sort((a, b) => b.lunes.getTime() - a.lunes.getTime());
}

// ---------------------------------------------------------------------------
// Modelo de fila por pestaña
// ---------------------------------------------------------------------------

const TRAMOS_CANCELADO = [
  "Cancelado antes de aprobar",
  "Cancelado sin cotizar",
  "Cancelado tras cotizar",
  "Cancelado con orden emitida",
];

interface FilaMacro {
  s: SolicitudResumen;
  fecha: string;
  recibido: boolean;
  tramos: number;
  ciclo: number | null;
  diasTarde: number;
  totalSc: number;
  totalOc: number;
  conforme: boolean;
  prioridad: PrioridadRequerimiento;
}

function filaMacro(s: SolicitudResumen): FilaMacro {
  const flujo = s.flujo as FlujoMacroSolicitud;
  const req = flujo.requerimiento;
  const recibido = req.estado === "recibido";
  const totalSc = flujo.solicitudesCotizacion.length;
  const totalOc = flujo.solicitudesCotizacion.reduce(
    (n, sc) => n + sc.ordenes.total,
    0,
  );
  const tramos = recibido
    ? 4
    : totalOc > 0
      ? 3
      : totalSc > 0
        ? 2
        : req.fueAprobado
          ? 1
          : 0;
  const ciclo = recibido && req.cerradoEn ? diasEntre(s.creadoEn, req.cerradoEn) : null;
  const diasTarde =
    recibido && req.cerradoEn && req.fechaEntregaRequerida
      ? Math.max(0, diasEntre(req.fechaEntregaRequerida, req.cerradoEn))
      : 0;
  return {
    s,
    fecha: s.creadoEn,
    recibido,
    tramos,
    ciclo,
    diasTarde,
    totalSc,
    totalOc,
    conforme: req.conformidad,
    prioridad: req.prioridad,
  };
}

type EstadoPre = "recibida" | "mixta" | "cancelada";

interface FilaPre {
  s: SolicitudResumen;
  fecha: string;
  estado: EstadoPre;
  monto: number;
  pagos: number;
  archivos: number;
  proveedores: string[];
  rendicion: boolean;
  sinComprobante: boolean;
}

function filaPre(s: SolicitudResumen): FilaPre {
  const flujo = s.flujo as FlujoPrecotizadoSolicitud;
  const estado: EstadoPre =
    s.etapa === "cancelada" ? "cancelada" : s.etapa === "mixta" ? "mixta" : "recibida";
  const vigentes = flujo.grupos.filter((g) => g.estado !== "cancelada");
  const base = estado === "cancelada" ? flujo.grupos : vigentes;
  const proveedores = [
    ...new Set(base.flatMap((g) => (g.proveedor ? [g.proveedor.nombre] : []))),
  ];
  const pagos = vigentes.reduce((n, g) => n + g.pagos, 0);
  const archivos = vigentes.reduce((n, g) => n + g.archivos, 0);
  return {
    s,
    fecha: s.creadoEn,
    estado,
    monto: base.reduce((n, g) => n + g.montoTotal, 0),
    pagos,
    archivos,
    proveedores,
    rendicion: flujo.esRendicion,
    sinComprobante: estado !== "cancelada" && archivos === 0,
  };
}

// ---------------------------------------------------------------------------
// Piezas compartidas
// ---------------------------------------------------------------------------

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Segmentado({
  valor,
  onChange,
  opciones,
}: {
  valor: EstadoFiltro;
  onChange: (v: EstadoFiltro) => void;
  opciones: Array<{ v: EstadoFiltro; label: string; n: number }>;
}) {
  return (
    <div
      role="group"
      aria-label="Estado"
      className="inline-flex rounded-lg border border-border bg-muted p-0.5"
    >
      {opciones.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={valor === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "h-7 rounded-md px-2.5 text-sm font-medium transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-primary",
            valor === o.v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
          <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
            {o.n}
          </span>
        </button>
      ))}
    </div>
  );
}

function Recorrido({ fila }: { fila: FilaMacro }) {
  const label = fila.recibido
    ? "Recibido"
    : TRAMOS_CANCELADO[fila.tramos];
  return (
    <div>
      <div className="mb-1.5 flex gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-6 rounded-full",
              i < fila.tramos
                ? fila.recibido
                  ? "bg-emerald-500"
                  : "bg-foreground"
                : !fila.recibido && i === fila.tramos
                  ? "bg-destructive"
                  : "bg-foreground/10",
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-[13px] font-medium",
          fila.recibido ? "text-emerald-800" : "text-destructive",
        )}
      >
        {label}
      </p>
      {fila.recibido && (
        <p className="text-xs text-muted-foreground">
          {fila.totalSc} SC · {fila.totalOc} OC{fila.conforme ? " · conforme" : ""}
        </p>
      )}
    </div>
  );
}

function FechasMacro({ fila }: { fila: FilaMacro }) {
  const cierre = (fila.s.flujo as FlujoMacroSolicitud).requerimiento.cerradoEn;
  if (!fila.recibido || !cierre) {
    return <p className="text-[13px] tabular-nums">{fmtDia(fila.s.creadoEn)}</p>;
  }
  return (
    <div>
      <p className="whitespace-nowrap text-[13px] tabular-nums">
        {fmtDia(fila.s.creadoEn)} <span className="text-muted-foreground">→</span>{" "}
        {fmtDia(cierre)}
      </p>
      <p className="whitespace-nowrap text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">{fila.ciclo} d</span> ·{" "}
        {fila.diasTarde > 0 ? (
          <span className="font-medium text-amber-800">{fila.diasTarde} d tarde</span>
        ) : (
          <span className="font-medium text-emerald-800">A tiempo</span>
        )}
      </p>
    </div>
  );
}

function VacioFiltros() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
      <Clock className="size-9 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium">Nada coincide con estos filtros</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Quita algún filtro o cambia de pestaña.
      </p>
    </div>
  );
}

function ErrorCarga() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
      <Clock className="size-9 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium">No se pudo cargar el historial</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Vuelve a intentarlo en unos minutos.
      </p>
    </div>
  );
}

function CabeceraSemana({
  etiqueta,
  derecha,
}: {
  etiqueta: string;
  derecha: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground">
      <span>{etiqueta}</span>
      <span className="font-mono tabular-nums text-foreground">{derecha}</span>
    </div>
  );
}

const TH = "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground";

// ---------------------------------------------------------------------------
// Vista
// ---------------------------------------------------------------------------

export function SolicitudesHistorialView({ macro, precotizadas, tabInicial }: Props) {
  const [tab, setTab] = useState<Tab>(tabInicial);
  const [busqueda, setBusqueda] = useState("");
  const [obra, setObra] = useState("todas");
  const [tipo, setTipo] = useState<"todos" | TipoRequerimiento>("todos");
  const [estado, setEstado] = useState<EstadoFiltro>("todos");
  const [alerta, setAlerta] = useState(false);

  const filasMacro = useMemo(() => (macro ?? []).map(filaMacro), [macro]);
  const filasPre = useMemo(() => (precotizadas ?? []).map(filaPre), [precotizadas]);

  function cambiarTab(siguiente: Tab) {
    setTab(siguiente);
    setBusqueda("");
    setObra("todas");
    setTipo("todos");
    setEstado("todos");
    setAlerta(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", siguiente);
    window.history.replaceState(null, "", url);
  }

  const esMacro = tab === "macro";
  const cargado = esMacro ? macro !== null : precotizadas !== null;
  const origenes = esMacro ? filasMacro : filasPre;
  const obras = useMemo(
    () => [...new Set(origenes.map((f) => f.s.proyecto.nombre))].sort(),
    [origenes],
  );

  const termino = busqueda.trim().toLowerCase();
  function coincide(f: FilaMacro | FilaPre) {
    if (obra !== "todas" && f.s.proyecto.nombre !== obra) return false;
    if (!termino) return true;
    const proveedores = "proveedores" in f ? f.proveedores.join(" ") : "";
    return `${f.s.codigo} ${f.s.nombre} ${f.s.proyecto.nombre} ${f.s.creadoPor.name} ${proveedores}`
      .toLowerCase()
      .includes(termino);
  }

  const macroFiltradas = filasMacro
    .filter(coincide)
    .filter((f) => tipo === "todos" || f.s.tipo === tipo)
    .filter(
      (f) =>
        estado === "todos" || (estado === "recibido" ? f.recibido : !f.recibido),
    )
    .filter((f) => !alerta || (f.recibido && f.diasTarde > 0))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const preFiltradas = filasPre
    .filter(coincide)
    .filter(
      (f) =>
        estado === "todos" ||
        (estado === "recibido" ? f.estado !== "cancelada" : f.estado === "cancelada"),
    )
    .filter((f) => !alerta || f.sinComprobante)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const nRecibidos = esMacro
    ? filasMacro.filter((f) => f.recibido).length
    : filasPre.filter((f) => f.estado !== "cancelada").length;
  const nCancelados = origenes.length - nRecibidos;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/solicitudes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a solicitudes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Historial de solicitudes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo ya cerrado, separado por proceso.
        </p>
      </div>

      <div className="border-b border-border">
        <div role="tablist" aria-label="Historial por proceso" className="flex gap-1">
          <TabBoton
            id="tab-macro"
            controls="panel-historial"
            activo={esMacro}
            onClick={() => cambiarTab("macro")}
          >
            Macro Requerimientos
            <span className="font-mono text-xs text-muted-foreground">
              {macro?.length ?? "–"}
            </span>
          </TabBoton>
          <TabBoton
            id="tab-precotizadas"
            controls="panel-historial"
            activo={!esMacro}
            onClick={() => cambiarTab("precotizadas")}
          >
            Precotizadas
            <span className="font-mono text-xs text-muted-foreground">
              {precotizadas?.length ?? "–"}
            </span>
          </TabBoton>
        </div>
      </div>

      <div
        id="panel-historial"
        role="tabpanel"
        aria-labelledby={esMacro ? "tab-macro" : "tab-precotizadas"}
        className="space-y-3"
      >
        {!cargado ? (
          <ErrorCarga />
        ) : origenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
            <Clock className="size-9 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">
              {esMacro ? "Aún no hay requerimientos cerrados" : "Aún no hay precotizadas cerradas"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Las solicitudes recibidas o canceladas aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  aria-label="Buscar en el historial"
                  placeholder={
                    esMacro
                      ? "Buscar requerimiento, obra o solicitante…"
                      : "Buscar precotizada, proveedor u obra…"
                  }
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-muted-foreground/60 focus:border-ring focus:ring-3 focus:ring-ring/20"
                />
              </div>
              <Select value={obra} onValueChange={(v) => setObra(v ?? "todas")}>
                <SelectTrigger className="w-44">
                  <SelectValue>{obra === "todas" ? "Todas las obras" : obra}</SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="todas">Todas las obras</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {esMacro && (
                <Select
                  value={tipo}
                  onValueChange={(v) => setTipo((v ?? "todos") as typeof tipo)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue>
                      {tipo === "todos" ? "Todos los tipos" : TIPO_LABEL[tipo]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {(Object.keys(TIPO_LABEL) as TipoRequerimiento[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Segmentado
                valor={estado}
                onChange={setEstado}
                opciones={[
                  { v: "todos", label: "Todos", n: origenes.length },
                  { v: "recibido", label: esMacro ? "Recibidos" : "Recibidas", n: nRecibidos },
                  { v: "cancelado", label: esMacro ? "Cancelados" : "Canceladas", n: nCancelados },
                ]}
              />
              <button
                type="button"
                aria-pressed={alerta}
                onClick={() => setAlerta((a) => !a)}
                className={cn(
                  "ml-auto inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-primary",
                  alerta
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-800"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <AlertTriangle className="size-3.5" />
                {esMacro ? "Llegaron tarde" : "Sin comprobante"}
              </button>
            </div>

            {esMacro ? (
              <ResumenMacro filas={macroFiltradas} />
            ) : (
              <ResumenPre filas={preFiltradas} />
            )}

            {(esMacro ? macroFiltradas.length : preFiltradas.length) === 0 ? (
              <VacioFiltros />
            ) : esMacro ? (
              <TablaMacro filas={macroFiltradas} />
            ) : (
              <TablaPre filas={preFiltradas} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resúmenes
// ---------------------------------------------------------------------------

function ResumenMacro({ filas }: { filas: FilaMacro[] }) {
  const rec = filas.filter((f) => f.recibido);
  const conCiclo = rec.filter((f) => f.ciclo !== null);
  const promedio = conCiclo.length
    ? Math.round(conCiclo.reduce((n, f) => n + (f.ciclo ?? 0), 0) / conCiclo.length)
    : null;
  const tarde = rec.filter((f) => f.diasTarde > 0).length;
  const canc = filas.length - rec.length;
  if (filas.length === 0) return null;
  return (
    <p
      aria-live="polite"
      className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px] text-muted-foreground"
    >
      <span>
        <b className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
          {filas.length}
        </b>{" "}
        requerimientos
      </span>
      {rec.length > 0 && (
        <span>
          <b className="font-medium text-foreground">{rec.length}</b> recibidos
          {promedio !== null && (
            <>
              {" · ciclo promedio "}
              <b className="font-medium text-foreground">{promedio} d</b>
            </>
          )}
          {tarde > 0 && (
            <>
              {" · "}
              <b className="font-medium text-amber-800">{tarde}</b> con retraso
            </>
          )}
        </span>
      )}
      {canc > 0 && (
        <span>
          <b className="font-medium text-foreground">{canc}</b> cancelados
        </span>
      )}
    </p>
  );
}

function ResumenPre({ filas }: { filas: FilaPre[] }) {
  const ok = filas.filter((f) => f.estado !== "cancelada");
  const total = ok.reduce((n, f) => n + f.monto, 0);
  const rend = ok.filter((f) => f.rendicion).length;
  const sin = ok.filter((f) => f.sinComprobante).length;
  const canc = filas.length - ok.length;
  if (filas.length === 0) return null;
  return (
    <p
      aria-live="polite"
      className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px] text-muted-foreground"
    >
      <span>
        <b className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
          {fmtMoney(total)}
        </b>{" "}
        en {ok.length} {ok.length === 1 ? "recibida" : "recibidas"}
      </span>
      {rend > 0 && (
        <span>
          <b className="font-medium text-foreground">{rend}</b>{" "}
          {rend === 1 ? "rendición" : "rendiciones"}
        </span>
      )}
      {sin > 0 && (
        <span>
          <b className="font-medium text-amber-800">{sin}</b> sin comprobante
        </span>
      )}
      {canc > 0 && (
        <span>
          <b className="font-medium text-foreground">{canc}</b>{" "}
          {canc === 1 ? "cancelada" : "canceladas"} (no suman)
        </span>
      )}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Macro
// ---------------------------------------------------------------------------

function TablaMacro({ filas }: { filas: FilaMacro[] }) {
  const semanas = agruparPorSemana(filas);
  return (
    <>
      <div className="md:hidden">
        {semanas.map((sem) => (
          <div key={sem.lunes.getTime()} className="mb-2">
            <CabeceraSemana etiqueta={etiquetaSemana(sem.lunes)} derecha={sem.filas.length} />
            <div className="grid gap-2">
              {sem.filas.map((f) => (
                <Link
                  key={f.s.id}
                  href={f.s.hrefDetalle}
                  className="rounded-lg border border-border bg-card p-3 transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{f.s.codigo}</p>
                      <p className="truncate text-xs text-muted-foreground">{f.s.nombre}</p>
                    </div>
                    <Chip className={TIPO_CLASS[f.s.tipo]}>{TIPO_LABEL[f.s.tipo]}</Chip>
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {f.s.proyecto.nombre}
                  </p>
                  <div className="mt-2.5 flex items-end justify-between gap-3">
                    <Recorrido fila={f} />
                    <FechasMacro fila={f} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full min-w-[900px] table-fixed text-sm">
          <colgroup>
            <col className="w-[27%]" />
            <col className="w-[24%]" />
            <col className="w-[12%]" />
            <col className="w-[19%]" />
            <col className="w-[15%]" />
            <col className="w-[3%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={TH}>Requerimiento</th>
              <th className={TH}>Obra y solicitante</th>
              <th className={TH}>Tipo</th>
              <th className={TH}>Recorrido</th>
              <th className={TH}>Solicitado → recibido</th>
              <th className={TH}>
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>
          {semanas.map((sem) => (
            <tbody key={sem.lunes.getTime()} className="divide-y divide-border">
              <tr className="border-t border-border bg-muted/30 first:border-t-0">
                <td colSpan={6} className="p-0">
                  <CabeceraSemana etiqueta={etiquetaSemana(sem.lunes)} derecha={sem.filas.length} />
                </td>
              </tr>
              {sem.filas.map((f) => (
                <tr
                  key={f.s.id}
                  className="group transition-colors duration-[120ms] hover:bg-primary/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={f.s.hrefDetalle}
                      className="block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-medium">{f.s.codigo}</span>
                        {f.prioridad === 'urgente' && (
                          <Chip className="bg-destructive/10 text-destructive">
                            <Zap className="size-3" />
                            Urgente
                          </Chip>
                        )}
                        {f.prioridad === 'alta' && (
                          <Chip className="bg-amber-100 text-amber-900">
                            <ChevronsUp className="size-3" />
                            Prioridad alta
                          </Chip>
                        )}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[13px] text-muted-foreground"
                        title={f.s.nombre}
                      >
                        {f.s.nombre}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate font-medium" title={f.s.proyecto.nombre}>
                      {f.s.proyecto.nombre}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {f.s.creadoPor.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Chip className={TIPO_CLASS[f.s.tipo]}>{TIPO_LABEL[f.s.tipo]}</Chip>
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                      {(f.s.flujo as FlujoMacroSolicitud).requerimiento.items} ítems
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Recorrido fila={f} />
                  </td>
                  <td className="px-4 py-3">
                    <FechasMacro fila={f} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight
                      aria-hidden
                      className="size-4 text-muted-foreground/50 transition-[color,transform] duration-[160ms] group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Precotizadas
// ---------------------------------------------------------------------------

function EstadoPreChip({ estado }: { estado: EstadoPre }) {
  if (estado === "cancelada")
    return (
      <Chip className="bg-destructive/10 text-destructive">
        <X className="size-3" />
        Cancelada
      </Chip>
    );
  if (estado === "mixta")
    return (
      <Chip className="bg-muted text-muted-foreground">
        <Check className="size-3" />
        Grupos cerrados
      </Chip>
    );
  return (
    <Chip className="bg-emerald-500/10 text-emerald-800">
      <Check className="size-3" />
      Recibida
    </Chip>
  );
}

function Sustento({ fila }: { fila: FilaPre }) {
  if (fila.estado === "cancelada") return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 whitespace-nowrap text-[13px] text-muted-foreground">
      <span className="font-mono tabular-nums">
        {fila.pagos} {fila.pagos === 1 ? "pago" : "pagos"}
      </span>
      {fila.archivos > 0 ? (
        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
          <Paperclip className="size-3.5" />
          {fila.archivos}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-medium text-amber-800">
          <AlertTriangle className="size-3.5" />
          Sin comprobante
        </span>
      )}
    </span>
  );
}

function Proveedor({ fila }: { fila: FilaPre }) {
  if (fila.rendicion) return <>Varios</>;
  if (fila.proveedores.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <>
      {fila.proveedores[0]}
      {fila.proveedores.length > 1 && (
        <span className="ml-1 font-mono text-xs text-muted-foreground">
          +{fila.proveedores.length - 1}
        </span>
      )}
    </>
  );
}

function Monto({ fila }: { fila: FilaPre }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap font-mono text-sm tabular-nums",
        fila.estado === "cancelada"
          ? "font-normal text-muted-foreground line-through decoration-muted-foreground/50"
          : "font-medium",
      )}
    >
      {fmtMoney(fila.monto)}
    </span>
  );
}

function TablaPre({ filas }: { filas: FilaPre[] }) {
  const semanas = agruparPorSemana(filas);
  const subtotal = (fs: FilaPre[]) =>
    fmtMoney(fs.filter((f) => f.estado !== "cancelada").reduce((n, f) => n + f.monto, 0));
  return (
    <>
      <div className="md:hidden">
        {semanas.map((sem) => (
          <div key={sem.lunes.getTime()} className="mb-2">
            <CabeceraSemana etiqueta={etiquetaSemana(sem.lunes)} derecha={subtotal(sem.filas)} />
            <div className="grid gap-2">
              {sem.filas.map((f) => (
                <Link
                  key={f.s.id}
                  href={f.s.hrefDetalle}
                  className="rounded-lg border border-border bg-card p-3 transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{f.s.codigo}</span>
                        {f.rendicion && (
                          <Chip className="bg-primary/10 text-primary">Rendición</Chip>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{f.s.nombre}</p>
                    </div>
                    <EstadoPreChip estado={f.estado} />
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {f.s.proyecto.nombre}
                  </p>
                  <div className="mt-2.5 flex items-end justify-between gap-3">
                    <Sustento fila={f} />
                    <Monto fila={f} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full min-w-[960px] table-fixed text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[19%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={TH}>Precotizada</th>
              <th className={TH}>Obra y solicitante</th>
              <th className={TH}>Proveedor</th>
              <th className={TH}>Sustento</th>
              <th className={TH}>Estado</th>
              <th className={cn(TH, "text-right")}>Monto</th>
              <th className={TH}>Fecha</th>
            </tr>
          </thead>
          {semanas.map((sem) => (
            <tbody key={sem.lunes.getTime()} className="divide-y divide-border">
              <tr className="border-t border-border bg-muted/30 first:border-t-0">
                <td colSpan={5} className="px-4 py-2 text-xs font-medium text-muted-foreground">
                  {etiquetaSemana(sem.lunes)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-xs tabular-nums">
                  {subtotal(sem.filas)}
                </td>
                <td />
              </tr>
              {sem.filas.map((f) => (
                <tr
                  key={f.s.id}
                  className="transition-colors duration-[120ms] hover:bg-primary/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={f.s.hrefDetalle}
                      className="block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-medium hover:underline hover:underline-offset-4">
                          {f.s.codigo}
                        </span>
                        {f.rendicion && (
                          <Chip className="bg-primary/10 text-primary">Rendición</Chip>
                        )}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[13px] text-muted-foreground"
                        title={f.s.nombre}
                      >
                        {f.s.nombre}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate font-medium" title={f.s.proyecto.nombre}>
                      {f.s.proyecto.nombre}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {f.s.creadoPor.name}
                    </p>
                  </td>
                  <td className="truncate px-4 py-3">
                    <Proveedor fila={f} />
                  </td>
                  <td className="px-4 py-3">
                    <Sustento fila={f} />
                  </td>
                  <td className="px-4 py-3">
                    <EstadoPreChip estado={f.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Monto fila={f} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] tabular-nums text-muted-foreground">
                    {fmtDia(f.fecha)}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}
