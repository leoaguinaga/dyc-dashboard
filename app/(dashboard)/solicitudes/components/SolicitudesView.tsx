"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  History,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/shared/KanbanBoard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import type {
  ColumnaKanbanSolicitud,
  EtapaSolicitud,
  OrigenSolicitud,
  SolicitudResumen,
  TipoRequerimiento,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { NuevaSolicitudSheet } from "./NuevaSolicitudSheet";

type OrigenFiltro = "todos" | OrigenSolicitud;
type EtapaFiltro = "todos" | EtapaSolicitud;
type View = "kanban" | "tabla";

const ORIGEN_LABEL: Record<OrigenSolicitud, string> = {
  macro: "Macro",
  precotizado: "Precotizada",
};

const ORIGEN_CLASS: Record<OrigenSolicitud, string> = {
  macro: "bg-blue-500/10 text-blue-700",
  precotizado: "bg-amber-500/15 text-amber-800",
};

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: "Civil",
  electrico: "Eléctrico",
  seguridad: "Seguridad",
  administrativo: "Administrativo",
};

const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: "bg-blue-500/10 text-blue-600",
  electrico: "bg-amber-500/10 text-amber-700",
  seguridad: "bg-orange-500/10 text-orange-700",
  administrativo: "bg-purple-500/10 text-purple-700",
};

const TIPO_COLOR: Record<TipoRequerimiento, string> = {
  civil: "bg-blue-500",
  electrico: "bg-amber-500",
  seguridad: "bg-orange-500",
  administrativo: "bg-purple-500",
};

const ETAPA_LABEL: Record<EtapaSolicitud, string> = {
  borrador: "Borrador",
  validacion_tecnica: "Validación técnica",
  observada: "Observada",
  aprobada_requerimiento: "Aprobada para cotizar",
  en_cotizacion: "En cotización",
  aprobada_tecnico: "Aprobación técnica",
  aprobada_gerencia: "Aprobación gerencial",
  emitida: "Emitida",
  recibida_parcial: "Recepción parcial",
  pendiente_conformidad: "Pendiente de conformidad",
  recibida: "Recibida",
  cancelada: "Cancelada",
  mixta: "Estados mixtos",
};

const ETAPA_CLASS: Record<EtapaSolicitud, string> = {
  borrador: "bg-muted text-muted-foreground",
  validacion_tecnica: "bg-blue-500/10 text-blue-700",
  observada: "bg-orange-500/10 text-orange-800",
  aprobada_requerimiento: "bg-cyan-500/10 text-cyan-800",
  en_cotizacion: "bg-violet-500/10 text-violet-700",
  aprobada_tecnico: "bg-indigo-500/10 text-indigo-700",
  aprobada_gerencia: "bg-fuchsia-500/10 text-fuchsia-700",
  emitida: "bg-sky-500/10 text-sky-700",
  recibida_parcial: "bg-amber-500/10 text-amber-800",
  pendiente_conformidad: "bg-yellow-500/10 text-yellow-800",
  recibida: "bg-emerald-500/10 text-emerald-800",
  cancelada: "bg-destructive/10 text-destructive",
  mixta: "bg-slate-500/10 text-slate-700",
};

const ETAPAS_TABLA_ACTIVAS = (
  Object.keys(ETAPA_LABEL) as EtapaSolicitud[]
).filter((etapa) => !["borrador", "recibida", "cancelada"].includes(etapa));

const KANBAN_COLUMNS: Array<{
  key: ColumnaKanbanSolicitud;
  label: string;
  colorClass: string;
}> = [
    {
      key: "requiere_correccion",
      label: "Requiere corrección",
      colorClass: "bg-orange-500/10 text-orange-800",
    },
    {
      key: "validacion_tecnica",
      label: "Validación técnica",
      colorClass: "bg-blue-500/10 text-blue-700",
    },
    {
      key: "cotizacion_seleccion",
      label: "Cotización y selección",
      colorClass: "bg-violet-500/10 text-violet-700",
    },
    {
      key: "aprobacion_gerencia",
      label: "Aprobación gerencial",
      colorClass: "bg-fuchsia-500/10 text-fuchsia-700",
    },
    {
      key: "por_emitir",
      label: "Por emitir",
      colorClass: "bg-cyan-500/10 text-cyan-800",
    },
    {
      key: "compra_curso",
      label: "Compra en curso",
      colorClass: "bg-sky-500/10 text-sky-700",
    },
    {
      key: "recepcion_conformidad",
      label: "Recepción y conformidad",
      colorClass: "bg-amber-500/10 text-amber-800",
    },
  ];

type SolicitudKanban = SolicitudResumen & {
  columnaKanban: ColumnaKanbanSolicitud;
};

function esSolicitudKanban(
  solicitud: SolicitudResumen,
): solicitud is SolicitudKanban {
  return solicitud.columnaKanban !== null;
}

const ESTADO_NATIVO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aprobado: "Aprobado",
  observado: "Observado",
  en_cotizacion: "En cotización",
  pendiente_conformidad: "Pendiente de conformidad",
  recibido: "Recibido",
  cancelado: "Cancelado",
  pendiente: "Pendiente de aprobación",
  aprobada_tecnico: "Aprobada técnicamente",
  aprobada: "Aprobada",
  emitida: "Emitida",
  recibida_parcial: "Recibida parcialmente",
  grupos_mixtos: "Grupos en estados distintos",
  sin_grupos: "Sin grupos",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function EstadoBadge({ solicitud }: { solicitud: SolicitudResumen }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
          ETAPA_CLASS[solicitud.etapa],
        )}
      >
        {ETAPA_LABEL[solicitud.etapa]}
      </span>
      <span className="text-xs text-muted-foreground">
        {ESTADO_NATIVO_LABEL[solicitud.estadoNativo] ?? solicitud.estadoNativo}
      </span>
    </div>
  );
}

function NombreSolicitud({ solicitud }: { solicitud: SolicitudResumen }) {
  const grupos = solicitud.resumenGrupos;
  const observed = grupos?.observados
    ? " · " +
    grupos.observados +
    " observado" +
    (grupos.observados === 1 ? "" : "s")
    : "";
  const detalleGrupos = grupos
    ? grupos.total + " " + (grupos.total === 1 ? "grupo" : "grupos") + observed
    : null;

  return (
    <div>
      <span className="font-mono text-sm font-medium tabular-nums">
        {solicitud.codigo}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {solicitud.nombre}
      </span>
      {detalleGrupos && (
        <span className="mt-1 block text-xs text-muted-foreground">
          {detalleGrupos}
        </span>
      )}
    </div>
  );
}

function SolicitudesLeyenda({
  onScrollLeft,
  onScrollRight,
}: {
  onScrollLeft: () => void;
  onScrollRight: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onScrollLeft}
        aria-label="Desplazar kanban a la izquierda"
        className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
        {(Object.keys(TIPO_LABEL) as TipoRequerimiento[]).map((tipo) => (
          <span
            key={tipo}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
              TIPO_CLASS[tipo],
            )}
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", TIPO_COLOR[tipo])}
            />
            {TIPO_LABEL[tipo]}
          </span>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onScrollRight}
        aria-label="Desplazar kanban a la derecha"
        className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function SolicitudesKanban({
  solicitudes,
  emptyMessage,
}: {
  solicitudes: SolicitudResumen[];
  emptyMessage: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const operativas = solicitudes.filter(esSolicitudKanban);
  const kanbanEmptyMessage =
    solicitudes.length > 0
      ? "No hay solicitudes operativas. Los borradores y estados cerrados no se muestran en el Kanban."
      : emptyMessage;

  return (
    <div className="space-y-3">
      <SolicitudesLeyenda
        onScrollLeft={() =>
          scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
        }
        onScrollRight={() =>
          scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })
        }
      />
      <KanbanBoard
        scrollRef={scrollRef}
        items={operativas}
        columns={KANBAN_COLUMNS}
        getStatus={(solicitud) => solicitud.columnaKanban}
        getId={(solicitud) => solicitud.id}
        emptyMessage={kanbanEmptyMessage}
        renderCard={(solicitud) => (
          <Link
            href={solicitud.hrefDetalle}
            className="flex items-stretch gap-2.5 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <div
              className={cn(
                "w-1.5 shrink-0 self-stretch rounded-xl",
                TIPO_COLOR[solicitud.tipo],
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <NombreSolicitud solicitud={solicitud} />
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                    ORIGEN_CLASS[solicitud.origen],
                  )}
                >
                  {ORIGEN_LABEL[solicitud.origen]}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium">
                {solicitud.proyecto.nombre}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{solicitud.creadoPor.name}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  {formatDate(solicitud.creadoEn)}
                </span>
              </div>
            </div>
          </Link>
        )}
      />
    </div>
  );
}

interface Props {
  solicitudes: SolicitudResumen[];
  puedeCrearPrecotizado: boolean;
  abrirNuevaSolicitud?: boolean;
}

export function SolicitudesView({
  solicitudes,
  puedeCrearPrecotizado,
  abrirNuevaSolicitud = false,
}: Props) {
  const [view, setView] = useState<View>("kanban");
  const [origen, setOrigen] = useState<OrigenFiltro>("todos");
  const [etapa, setEtapa] = useState<EtapaFiltro>("todos");
  const [proyectoId, setProyectoId] = useState("todos");
  const [search, setSearch] = useState("");

  const proyectos = useMemo(() => {
    const unique = new Map(
      solicitudes.map((solicitud) => [
        solicitud.proyecto.id,
        solicitud.proyecto,
      ]),
    );
    return [...unique.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [solicitudes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return solicitudes.filter((solicitud) => {
      if (origen !== "todos" && solicitud.origen !== origen) return false;
      if (view === "tabla" && etapa !== "todos" && solicitud.etapa !== etapa)
        return false;
      if (proyectoId !== "todos" && solicitud.proyecto.id !== proyectoId)
        return false;
      if (!term) return true;

      return [
        solicitud.codigo,
        solicitud.nombre,
        solicitud.proyecto.nombre,
        solicitud.proyecto.codigo ?? "",
        solicitud.creadoPor.name,
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [etapa, origen, proyectoId, search, solicitudes, view]);

  const emptyMessage = search.trim()
    ? "Sin resultados para “" + search.trim() + "”"
    : "No hay solicitudes con los filtros seleccionados";

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">
            Requerimientos para cotizar y compras precotizadas en una sola
            vista.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Link href="/solicitudes/historial">
            <Button variant="outline">
              <History className="size-4" />
              Historial
            </Button>
          </Link>
          <NuevaSolicitudSheet
            puedeCrearPrecotizado={puedeCrearPrecotizado}
            defaultOpen={abrirNuevaSolicitud}
          />
        </div>
      </div>

      <Tabs
        value={view}
        onValueChange={(value) => setView(value as View)}
        className="gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <TabsList aria-label="Cambiar vista de solicitudes">
            <TabsIndicator />
            <TabsTab value="kanban">Kanban</TabsTab>
            <TabsTab value="tabla">Tabla</TabsTab>
          </TabsList>
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar por código, proyecto o solicitante…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none transition-[border-color,box-shadow] duration-[120ms] focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
          </div>
          <Select
            value={origen}
            onValueChange={(value) =>
              setOrigen((value ?? "todos") as OrigenFiltro)
            }
          >
            <SelectTrigger className="sm:w-36">
              <SelectValue>
                {origen === "todos" ? "Todos los tipos" : ORIGEN_LABEL[origen]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="macro">Macro</SelectItem>
              <SelectItem value="precotizado">Precotizadas</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={proyectoId}
            onValueChange={(value) => setProyectoId(value ?? "todos")}
          >
            <SelectTrigger className="w-38">
              <SelectValue>
                {proyectoId === "todos"
                  ? "Todas las obras"
                  : (proyectos.find((proyecto) => proyecto.id === proyectoId)
                    ?.nombre ?? "Obra")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectItem value="todos">Todas las obras</SelectItem>
              {proyectos.map((proyecto) => (
                <SelectItem key={proyecto.id} value={proyecto.id}>
                  {proyecto.codigo
                    ? proyecto.codigo + " - " + proyecto.nombre
                    : proyecto.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {view === "tabla" && (
            <Select
              value={etapa}
              onValueChange={(value) =>
                setEtapa((value ?? "todos") as EtapaFiltro)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {etapa === "todos" ? "Todas las etapas" : ETAPA_LABEL[etapa]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las etapas</SelectItem>
                {ETAPAS_TABLA_ACTIVAS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ETAPA_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsPanel value="kanban">
          <SolicitudesKanban
            solicitudes={filtered}
            emptyMessage={emptyMessage}
          />
        </TabsPanel>

        <TabsPanel value="tabla">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
              <ClipboardList className="size-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">{emptyMessage}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajusta los filtros o crea una nueva solicitud.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-2 md:hidden">
                {filtered.map((solicitud) => (
                  <Link
                    key={solicitud.id}
                    href={solicitud.hrefDetalle}
                    className="rounded-lg border border-border p-3 transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <NombreSolicitud solicitud={solicitud} />
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                          ORIGEN_CLASS[solicitud.origen],
                        )}
                      >
                        {ORIGEN_LABEL[solicitud.origen]}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Proyecto</p>
                        <p className="mt-0.5 font-medium">
                          {solicitud.proyecto.nombre}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Estado</p>
                        <div className="mt-0.5">
                          <EstadoBadge solicitud={solicitud} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Solicitud
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Origen
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Proyecto
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Solicitante
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((solicitud) => (
                      <tr
                        key={solicitud.id}
                        className="transition-colors duration-[120ms] hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={solicitud.hrefDetalle}
                            className="hover:underline hover:underline-offset-4"
                          >
                            <NombreSolicitud solicitud={solicitud} />
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                              ORIGEN_CLASS[solicitud.origen],
                            )}
                          >
                            {ORIGEN_LABEL[solicitud.origen]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {solicitud.proyecto.nombre}
                          </p>
                          {solicitud.proyecto.codigo && (
                            <p className="text-xs font-mono text-muted-foreground">
                              {solicitud.proyecto.codigo}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge solicitud={solicitud} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {solicitud.creadoPor.name}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono tabular-nums text-muted-foreground">
                          {formatDate(solicitud.creadoEn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsPanel>
      </Tabs>
    </div>
  );
}
