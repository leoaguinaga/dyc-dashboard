"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Pago, PagoRecurrente, Proyecto } from "@/types/api";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/session";
import { PagosPageHeader } from "./PagosPageHeader";
import { PagosTableClient } from "./PagosTableClient";
import { PagosFijosPanel } from "./PagosFijosPanel";

const ESTADO_LABEL: Record<Pago["estadoEfectivo"], string> = {
  borrador: "Por completar",
  pendiente: "Pendiente",
  vencido: "Vencido",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const ESTADO_CLASS: Record<Pago["estadoEfectivo"], string> = {
  borrador: "bg-chart-3/10 text-chart-3",
  pendiente: "bg-muted text-muted-foreground",
  vencido: "bg-destructive/10 text-destructive",
  pagado: "bg-chart-2/10 text-chart-2",
  cancelado: "bg-muted text-muted-foreground/60",
};

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDeFecha(fecha: string) {
  return fecha.slice(0, 10);
}

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

function fmtFechaLarga(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

interface Grupo {
  fecha: string;
  etiqueta?: string;
  pagos: Pago[];
}

function agruparPorProyecto(pagos: Pago[]) {
  const map = new Map<
    string,
    { proyecto: Pick<Proyecto, "id" | "codigo" | "nombre">; pagos: Pago[] }
  >();
  for (const p of pagos) {
    const proyecto = p.proyecto ??
      p.ordenCompra?.proyecto ?? {
      id: "administracion",
      codigo: "ADM",
      nombre: "Administración / Oficina",
    };
    if (!map.has(proyecto.id)) map.set(proyecto.id, { proyecto, pagos: [] });
    map.get(proyecto.id)!.pagos.push(p);
  }
  return [...map.values()];
}

function FilaPago({
  p,
  fechaLabel,
}: {
  p: Pago;
  fechaLabel: "programada" | "real";
}) {
  const beneficiario =
    p.tipoBeneficiario === "trabajador"
      ? `Depósito a ${p.beneficiarioTrabajador?.nombre ?? p.beneficiarioNombre ?? "Trabajador"}`
      : (p.beneficiarioNombre ??
        p.ordenCompra?.proveedor?.razonSocial ??
        p.ordenCompra?.proveedorNombreLibre ??
        "Sin beneficiario");
  const conceptoOc =
    p.ordenCompra?.concepto ??
    (p.concepto && p.concepto !== beneficiario ? p.concepto : null) ??
    "Sin concepto";
  const identificador = p.ordenCompra
    ? `${p.ordenCompra.numero} · ${conceptoOc}`
    : (p.concepto ?? "Pago manual");

  return (
    <Link
      href={`/pagos/${p.id}`}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors duration-[120ms]"
    >
      <div className="flex items-center gap-2 min-w-0">
        {p.estadoEfectivo === "vencido" && (
          <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
        )}
        <div className="min-w-0">
          <span className="block truncate font-mono text-sm font-medium">
            {identificador}
          </span>
          <p className="truncate text-xs text-muted-foreground">
            {beneficiario}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
            ESTADO_CLASS[p.estadoEfectivo],
          )}
        >
          {ESTADO_LABEL[p.estadoEfectivo]}
        </span>
        <span className="w-28 text-right text-sm font-medium tabular-nums">
          {fmtMoney(Number(p.monto))}
        </span>
      </div>
      <span className="sr-only">{fechaLabel}</span>
    </Link>
  );
}

function GrupoFecha({
  grupo,
  fechaLabel,
}: {
  grupo: Grupo;
  fechaLabel: "programada" | "real";
}) {
  const porProyecto = agruparPorProyecto(grupo.pagos);
  const total = grupo.pagos.reduce((s, p) => s + Number(p.monto), 0);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-sm font-semibold capitalize">
          {grupo.etiqueta ?? fmtFechaLarga(grupo.fecha)}
        </p>
        <p className="text-xs text-muted-foreground">{fmtMoney(total)}</p>
      </div>
      {porProyecto.map(({ proyecto, pagos }) => (
        <div
          key={proyecto.id}
          className="border-b border-border last:border-b-0"
        >
          <div className="px-4 py-2.5">
            <Link
              href={`/proyectos/${proyecto.id}`}
              className="block min-w-0 hover:text-foreground transition-colors duration-[120ms]"
            >
              <span className="block truncate text-sm font-semibold text-foreground">
                {proyecto.nombre}
              </span>
              <span className="block truncate font-mono text-xs text-muted-foreground">
                {proyecto.codigo ?? "Sin código"}
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pagos.map((p) => (
              <FilaPago key={p.id} p={p} fechaLabel={fechaLabel} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PagosView({
  pagos,
  proyectos,
  pagosFijos,
}: {
  pagos: Pago[];
  proyectos: Proyecto[];
  pagosFijos: PagoRecurrente[];
}) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const puedePagar =
    role === "administrador" || role === "gerencia" || role === "admin_ti";
  const puedeCrearRecordatorio = [
    "supervisor_civil",
    "supervisor_electrico",
    "pdr",
    "ing_civil",
    "ing_electrico",
    "jefe_sig",
    "logistica",
    "administrador",
    "gerencia",
    "admin_ti",
  ].includes(role ?? "");
  const puedeVerFijos =
    role === "administrador" || role === "gerencia" || role === "admin_ti";
  const puedeCrearFijos = role === "administrador" || role === "admin_ti";
  const [tab, setTab] = useState<
    "borradores" | "pendientes" | "pagados" | "fijos"
  >("pendientes");
  const [fechaReporte, setFechaReporte] = useState(hoyISO);
  const [rangoDias, setRangoDias] = useState(7);

  // Control del Sheet de Pago Fijo (Crear / Editar)
  const [sheetFijoOpen, setSheetFijoOpen] = useState(false);
  const [pagoFijoAEditar, setPagoFijoAEditar] = useState<PagoRecurrente | null>(null);

  const handleNuevoPagoFijo = () => {
    setPagoFijoAEditar(null);
    setSheetFijoOpen(true);
  };

  const handleEditarPagoFijo = (pago: PagoRecurrente) => {
    setPagoFijoAEditar(pago);
    setSheetFijoOpen(true);
  };

  // Pagos pendientes (incluye vencidos)
  const pagosPendientes = useMemo(
    () => pagos.filter((p) => p.estado === "pendiente"),
    [pagos],
  );

  // Conteo de borradores
  const borradoresCount = useMemo(
    () => pagos.filter((p) => p.estado === "borrador").length,
    [pagos],
  );

  // Historial de pagados
  const pagadosGrupos = useMemo(() => {
    const desde = new Date();
    desde.setDate(desde.getDate() - rangoDias);
    const desdeIso = isoDeFecha(desde.toISOString());

    const items = pagos.filter(
      (p) =>
        p.estado === "pagado" &&
        p.fechaPagoReal &&
        isoDeFecha(p.fechaPagoReal) >= desdeIso,
    );
    const porFecha = new Map<string, Pago[]>();
    for (const p of items) {
      const f = isoDeFecha(p.fechaPagoReal!);
      if (!porFecha.has(f)) porFecha.set(f, []);
      porFecha.get(f)!.push(p);
    }
    return [...porFecha.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([fecha, ps]): Grupo => ({ fecha, pagos: ps }));
  }, [pagos, rangoDias]);

  // Borradores (por completar)
  const borradoresGrupos = useMemo<Grupo[]>(
    () =>
      pagos
        .filter((p) => p.estado === "borrador")
        .map((p) => ({
          fecha: p.fechaProgramada,
          etiqueta: "Por completar",
          pagos: [p],
        })),
    [pagos],
  );

  return (
    <div className="space-y-4">
      {/* Encabezado estándar del módulo */}
      <PagosPageHeader
        proyectos={proyectos}
        tab={tab}
        fechaReporte={fechaReporte}
        onFechaReporteChange={setFechaReporte}
        onNuevoPagoFijo={handleNuevoPagoFijo}
        puedeCrearFijos={puedeCrearFijos}
        puedeCrearRecordatorio={puedeCrearRecordatorio}
      />

      {/* Selector de Pestañas */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            onClick={() => setTab("pendientes")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]",
              tab === "pendientes"
                ? "bg-white shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Pendientes</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-xs font-semibold",
                tab === "pendientes"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {pagosPendientes.length}
            </span>
          </button>

          {/* <button
            onClick={() => setTab("borradores")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]",
              tab === "borradores"
                ? "bg-white shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Por completar</span>
            {borradoresCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.2 text-xs font-semibold text-amber-700">
                {borradoresCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("pagados")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]",
              tab === "pagados"
                ? "bg-white shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pagados
          </button> */}

          {puedeVerFijos && (
            <button
              onClick={() => setTab("fijos")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-[120ms]",
                tab === "fijos"
                  ? "bg-white shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Pagos fijos
            </button>
          )}
        </div>

        {/* Filtro de rango de días en pestaña Pagados */}
        {tab === "pagados" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ver historial:</span>
            <select
              value={rangoDias}
              onChange={(e) => setRangoDias(Number(e.target.value))}
              className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-medium outline-none focus:border-ring"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>
        )}
      </div>

      {/* Contenido según pestaña activa */}
      {tab === "pendientes" ? (
        <PagosTableClient
          pagos={pagosPendientes}
          proyectos={proyectos}
          fechaReporte={fechaReporte}
          tipo="pendientes"
          puedePagar={puedePagar}
        />
      ) : tab === "fijos" ? (
        <PagosFijosPanel
          pagosFijos={pagosFijos}
          proyectos={proyectos}
          puedeCrear={puedeCrearFijos}
          sheetOpen={sheetFijoOpen}
          onSheetOpenChange={setSheetFijoOpen}
          pagoAEditar={pagoFijoAEditar}
          onEditarPago={handleEditarPagoFijo}
        />
      ) : tab === "pagados" ? (
        pagadosGrupos.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              No hay pagos registrados en este rango de fechas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pagadosGrupos.map((g, i) => (
              <GrupoFecha
                key={`${g.fecha}-${g.etiqueta ?? i}`}
                grupo={g}
                fechaLabel="real"
              />
            ))}
          </div>
        )
      ) : tab === "borradores" ? (
        borradoresGrupos.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              No hay pagos pendientes de completar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {borradoresGrupos.map((g, i) => (
              <GrupoFecha
                key={`${g.fecha}-${g.etiqueta ?? i}`}
                grupo={g}
                fechaLabel="programada"
              />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
