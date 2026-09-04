"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PagoRecurrente, Proyecto } from "@/types/api";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatMoney(value?: string | number | null) {
  if (!value) return "S/ 0.00";
  return `S/ ${Number(value).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface Props {
  pagosFijos: PagoRecurrente[];
  proyectos: Proyecto[];
  puedeCrear: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  pagoAEditar?: PagoRecurrente | null;
  onEditarPago?: (pago: PagoRecurrente) => void;
}

export function PagosFijosPanel({
  pagosFijos: pagosFijosIniciales,
  proyectos,
  puedeCrear,
  sheetOpen: controlledOpen,
  onSheetOpenChange: setControlledOpen,
  pagoAEditar: controlledPagoAEditar,
  onEditarPago: setControlledPagoAEditar,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<PagoRecurrente[]>(pagosFijosIniciales);
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalPagoAEditar, setInternalPagoAEditar] =
    useState<PagoRecurrente | null>(null);

  // Filtros de barra
  const [search, setSearch] = useState("");
  const [centroFilter, setCentroFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | "activos" | "inactivos">("todos");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const pagoAEditar =
    controlledPagoAEditar !== undefined
      ? controlledPagoAEditar
      : internalPagoAEditar;

  const setOpen = (next: boolean) => {
    if (setControlledOpen) setControlledOpen(next);
    else setInternalOpen(next);
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal confirmación eliminación
  const [pagoAEliminar, setPagoAEliminar] = useState<PagoRecurrente | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [centroCosto, setCentroCosto] = useState<"obra" | "administracion">(
    "administracion",
  );
  const [form, setForm] = useState({
    concepto: "",
    diaPago: "",
    montoReferencial: "",
    proyectoId: "",
    beneficiarioNombre: "",
    categoria: "",
    banco: "",
    numeroCuenta: "",
    cci: "",
    activo: true,
  });

  // Mantener items sincronizados con props
  useEffect(() => {
    setItems(pagosFijosIniciales);
  }, [pagosFijosIniciales]);

  // Cargar datos al abrir el sheet
  useEffect(() => {
    if (open) {
      if (pagoAEditar) {
        setCentroCosto(
          pagoAEditar.centroCosto === "obra" ? "obra" : "administracion",
        );
        setForm({
          concepto: pagoAEditar.concepto ?? "",
          diaPago: String(pagoAEditar.diaVencimiento ?? ""),
          montoReferencial: pagoAEditar.montoReferencial
            ? String(pagoAEditar.montoReferencial)
            : "",
          proyectoId: pagoAEditar.proyectoId ?? "",
          beneficiarioNombre: pagoAEditar.beneficiarioNombre ?? "",
          categoria: pagoAEditar.categoria ?? "",
          banco: pagoAEditar.banco ?? "",
          numeroCuenta: pagoAEditar.numeroCuenta ?? "",
          cci: pagoAEditar.cci ?? "",
          activo: pagoAEditar.activo ?? true,
        });
      } else {
        setCentroCosto("administracion");
        setForm({
          concepto: "",
          diaPago: "",
          montoReferencial: "",
          proyectoId: "",
          beneficiarioNombre: "",
          categoria: "",
          banco: "",
          numeroCuenta: "",
          cci: "",
          activo: true,
        });
      }
      setError(null);
    }
  }, [open, pagoAEditar]);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const abrirEditar = (pago: PagoRecurrente) => {
    if (setControlledPagoAEditar) {
      setControlledPagoAEditar(pago);
    } else {
      setInternalPagoAEditar(pago);
      setInternalOpen(true);
    }
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const diaPago = Number(form.diaPago);
    if (
      !form.concepto.trim() ||
      !Number.isInteger(diaPago) ||
      diaPago < 1 ||
      diaPago > 31 ||
      (centroCosto === "obra" && !form.proyectoId)
    ) {
      setError("Completa el concepto y elige un día de pago entre 1 y 31.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        concepto: form.concepto.trim(),
        diaVencimiento: diaPago,
        montoReferencial: form.montoReferencial
          ? Number(form.montoReferencial)
          : undefined,
        centroCosto,
        proyectoId: centroCosto === "obra" ? form.proyectoId : undefined,
        beneficiarioNombre: form.beneficiarioNombre.trim() || undefined,
        categoria: form.categoria.trim() || undefined,
        banco: form.banco.trim() || undefined,
        numeroCuenta: form.numeroCuenta.trim() || undefined,
        cci: form.cci.trim() || undefined,
        ...(pagoAEditar ? { activo: form.activo } : {}),
      };

      if (pagoAEditar) {
        const actualizado = await api.patch<PagoRecurrente>(
          `/pagos/recurrentes/${pagoAEditar.id}`,
          payload,
        );
        setItems((prev) =>
          prev.map((item) => (item.id === actualizado.id ? actualizado : item)),
        );
      } else {
        const nuevo = await api.post<PagoRecurrente>(
          "/pagos/recurrentes",
          payload,
        );
        setItems((prev) => [...prev, nuevo]);
      }

      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el pago fijo",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar() {
    if (!pagoAEliminar) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/pagos/recurrentes/${pagoAEliminar.id}`);
      setItems((prev) => prev.filter((item) => item.id !== pagoAEliminar.id));
      setPagoAEliminar(null);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar el pago fijo",
      );
    } finally {
      setDeleting(false);
    }
  }

  // Filtrado y ordenamiento de la tabla
  const filtered = useMemo(() => {
    let result = items;

    if (estadoFilter === "activos") {
      result = result.filter((p) => p.activo);
    } else if (estadoFilter === "inactivos") {
      result = result.filter((p) => !p.activo);
    }

    if (centroFilter === "administracion") {
      result = result.filter((p) => p.centroCosto === "administracion");
    } else if (centroFilter !== "todos") {
      result = result.filter((p) => p.proyectoId === centroFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.concepto.toLowerCase().includes(q) ||
          p.beneficiarioNombre?.toLowerCase().includes(q) ||
          p.categoria?.toLowerCase().includes(q) ||
          p.banco?.toLowerCase().includes(q) ||
          p.numeroCuenta?.toLowerCase().includes(q) ||
          p.proyecto?.nombre.toLowerCase().includes(q) ||
          p.proyecto?.codigo?.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => a.diaVencimiento - b.diaVencimiento);
  }, [items, search, centroFilter, estadoFilter]);

  // Métricas ejecutivas
  const totalMensualEstimado = useMemo(() => {
    return filtered
      .filter((p) => p.activo)
      .reduce((sum, p) => sum + (Number(p.montoReferencial) || 0), 0);
  }, [filtered]);

  const activosCount = useMemo(() => {
    return items.filter((p) => p.activo).length;
  }, [items]);

  return (
    <div className="space-y-3">
      {/* Barra de Filtros y Búsqueda (Sin títulos redundantes) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Buscador */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Buscar pagos fijos"
            placeholder="Buscar por concepto, proveedor, banco o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>

        {/* Filtro por Centro de Costo */}
        <Select value={centroFilter} onValueChange={(v) => setCentroFilter(v ?? "todos")}>
          <SelectTrigger className="w-44">
            <p>Centro de costo</p>
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="todos">Todos los centros</SelectItem>
            <SelectItem value="administracion">Administración / Oficina</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.codigo ? `${p.codigo} · ${p.nombre}` : p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Estado */}
        <Select
          value={estadoFilter}
          onValueChange={(v) => setEstadoFilter((v ?? "todos") as "todos" | "activos" | "inactivos")}
        >
          <SelectTrigger className="w-36">
            <p>Estado</p>
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activos">Solo activos</SelectItem>
            <SelectItem value="inactivos">Solo inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumen Superior de Métricas */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando <strong>{filtered.length}</strong> de <strong>{items.length}</strong> pagos fijos ({activosCount} activos)
        </span>
        <span>
          Total proyectado mensual:{" "}
          <strong className="text-foreground font-semibold font-mono tabular-nums">
            {formatMoney(totalMensualEstimado)}
          </strong>
        </span>
      </div>

      {/* Contenedor Principal de la Tabla */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-3">
          <CalendarClock className="size-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Aún no hay pagos fijos registrados
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Registra servicios y gastos recurrentes (ej. Internet día 5, alquiler día 15) para que se generen automáticamente cada mes.
            </p>
          </div>
          {puedeCrear && (
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Registrar primer pago fijo
            </Button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            No hay pagos fijos que coincidan con los filtros aplicados
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setCentroFilter("todos");
              setEstadoFilter("todos");
            }}
            className="text-xs"
          >
            Restablecer filtros
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="w-24 px-3 py-3 text-center">Día</th>
                  <th className="px-3 py-3 min-w-[220px]">Concepto y Categoría</th>
                  <th className="px-3 py-3 min-w-[160px]">Centro de Costo</th>
                  <th className="px-3 py-3 min-w-[200px]">Beneficiario y Destino</th>
                  <th className="px-3 py-3 text-right min-w-[130px]">Monto Mensual</th>
                  <th className="px-3 py-3 text-center w-24">Estado</th>
                  <th className="px-3 py-3 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((pago) => (
                  <tr
                    key={pago.id}
                    className="hover:bg-muted/20 transition-colors duration-100"
                  >
                    {/* Día del mes */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center font-mono font-semibold text-xs bg-primary/10 text-primary rounded px-2 py-1">
                        Día {String(pago.diaVencimiento).padStart(2, "0")}
                      </span>
                    </td>

                    {/* Concepto y Categoría */}
                    <td className="px-3 py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-sm leading-tight">
                          {pago.concepto}
                        </p>
                        {pago.categoria && (
                          <span className="inline-block text-[11px] text-muted-foreground">
                            {pago.categoria}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Centro de Costo */}
                    <td className="px-3 py-3">
                      {pago.centroCosto === "obra" && pago.proyecto ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 text-blue-700 px-2 py-0.5 text-xs font-medium truncate max-w-[180px]">
                          {pago.proyecto.codigo ? `${pago.proyecto.codigo} · ` : ""}
                          {pago.proyecto.nombre}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-muted/60 text-muted-foreground px-2 py-0.5 text-xs font-medium">
                          Administración
                        </span>
                      )}
                    </td>

                    {/* Beneficiario y Destino Bancario */}
                    <td className="px-3 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
                          {pago.beneficiarioNombre || (
                            <span className="text-muted-foreground font-normal italic">
                              Sin beneficiario especificado
                            </span>
                          )}
                        </p>
                        {(pago.banco || pago.numeroCuenta || pago.cci) && (
                          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                            {[pago.banco, pago.numeroCuenta, pago.cci ? `CCI: ${pago.cci}` : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Monto Mensual */}
                    <td className="px-3 py-3 text-right">
                      {pago.montoReferencial ? (
                        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(pago.montoReferencial)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Variable
                        </span>
                      )}
                    </td>

                    {/* Estado Activo / Inactivo */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                          pago.activo
                            ? "bg-chart-2/10 text-chart-2"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {pago.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3 text-right">
                      {puedeCrear && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEditar(pago)}
                            title="Editar pago fijo"
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPagoAEliminar(pago)}
                            title="Eliminar pago fijo"
                            className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sheet para Crear o Editar Pago Fijo */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-md w-full overflow-y-auto flex flex-col justify-between p-6"
        >
          <div className="space-y-4">
            <SheetHeader className="pb-3 border-b border-border text-left">
              <SheetTitle className="text-base font-semibold">
                {pagoAEditar ? "Editar pago fijo" : "Nuevo pago fijo"}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {pagoAEditar
                  ? "Actualiza los parámetros del pago recurrente mensual."
                  : "Registra un servicio u obligación mensual recurrente."}
              </SheetDescription>
            </SheetHeader>

            <form id="pago-fijo-form" onSubmit={submit} className="space-y-3.5">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-foreground">Concepto *</span>
                <Input
                  autoFocus
                  value={form.concepto}
                  onChange={(event) => set("concepto", event.target.value)}
                  placeholder="Ej. Internet de oficina"
                  className="h-8 text-xs"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-foreground">Día de pago *</span>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    step={1}
                    value={form.diaPago}
                    onChange={(event) => set("diaPago", event.target.value)}
                    placeholder="Ej. 3"
                    className="h-8 text-xs"
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Del 1 al 31 de cada mes.
                  </span>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-foreground">Monto referencial (S/)</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.montoReferencial}
                    onChange={(event) => set("montoReferencial", event.target.value)}
                    placeholder="Opcional"
                    className="h-8 text-xs font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Ajustable al pagar.
                  </span>
                </label>
              </div>

              {/* Centro de Costo */}
              <fieldset className="grid gap-1.5">
                <legend className="text-xs font-medium text-foreground">Centro de costo *</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["administracion", "obra"] as const).map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                        centroCosto === option
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-border text-muted-foreground hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="centroCostoPagoFijo"
                        value={option}
                        checked={centroCosto === option}
                        onChange={() => setCentroCosto(option)}
                        className="size-3.5 text-primary"
                      />
                      {option === "administracion" ? "Administración" : "Obra"}
                    </label>
                  ))}
                </div>
              </fieldset>

              {centroCosto === "obra" && (
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-foreground">Obra asignada *</span>
                  <select
                    value={form.proyectoId}
                    onChange={(event) => set("proyectoId", event.target.value)}
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    required
                  >
                    <option value="">Seleccionar obra</option>
                    {proyectos.map((proyecto) => (
                      <option key={proyecto.id} value={proyecto.id}>
                        {proyecto.codigo ? `${proyecto.codigo} · ` : ""}
                        {proyecto.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-foreground">Beneficiario</span>
                  <Input
                    value={form.beneficiarioNombre}
                    onChange={(event) => set("beneficiarioNombre", event.target.value)}
                    placeholder="Ej. Claro, Sedapal"
                    className="h-8 text-xs"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-foreground">Categoría</span>
                  <Input
                    value={form.categoria}
                    onChange={(event) => set("categoria", event.target.value)}
                    placeholder="Ej. Servicios, Alquiler"
                    className="h-8 text-xs"
                  />
                </label>
              </div>

              {/* Datos Bancarios Opcionales */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-medium text-foreground block">
                  Datos de destino (opcional)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Input
                      value={form.banco}
                      onChange={(event) => set("banco", event.target.value)}
                      placeholder="Banco / Yape"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={form.numeroCuenta}
                      onChange={(event) => set("numeroCuenta", event.target.value)}
                      placeholder="N° de cuenta o celular"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    value={form.cci}
                    onChange={(event) => set("cci", event.target.value)}
                    placeholder="Código Interbancario (CCI)"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Estado Activo para edición */}
              {pagoAEditar && (
                <div className="pt-2 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => set("activo", e.target.checked)}
                      className="size-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="font-medium text-foreground">
                      Activo (genera borradores mensuales automáticos)
                    </span>
                  </label>
                </div>
              )}

              {error && (
                <p className="text-xs text-destructive pt-1" role="alert">
                  {error}
                </p>
              )}
            </form>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="pago-fijo-form"
              size="sm"
              disabled={saving}
              className="text-xs"
            >
              {saving
                ? "Guardando…"
                : pagoAEditar
                  ? "Guardar cambios"
                  : "Registrar pago fijo"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal Confirmación de Eliminación */}
      <Dialog
        open={!!pagoAEliminar}
        onOpenChange={(next) => !next && setPagoAEliminar(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Eliminar pago fijo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              ¿Estás seguro de que deseas eliminar el pago recurrente{" "}
              <strong className="text-foreground">
                &ldquo;{pagoAEliminar?.concepto}&rdquo;
              </strong>
              ? Los pagos ya generados en meses anteriores no se borrarán, pero
              no se volverán a generar borradores futuros.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagoAEliminar(null)}
              disabled={deleting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEliminar}
              disabled={deleting}
              className="text-xs"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
