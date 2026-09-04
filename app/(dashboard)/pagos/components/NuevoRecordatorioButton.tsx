"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Proyecto } from "@/types/api";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NuevoRecordatorioButton({
  proyectos,
}: {
  proyectos: Proyecto[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centroCosto, setCentroCosto] = useState<"obra" | "administracion">(
    "obra",
  );
  const [form, setForm] = useState({
    concepto: "",
    monto: "",
    fechaProgramada: "",
    proyectoId: "",
    beneficiarioNombre: "",
    banco: "",
    numeroCuenta: "",
    nota: "",
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !form.concepto.trim() ||
      !form.monto ||
      !form.fechaProgramada ||
      (centroCosto === "obra" && !form.proyectoId)
    ) {
      setError("Completa concepto, monto, fecha y centro de costo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/pagos/recordatorios", {
        concepto: form.concepto.trim(),
        monto: Number(form.monto),
        fechaProgramada: form.fechaProgramada,
        centroCosto,
        proyectoId: centroCosto === "obra" ? form.proyectoId : undefined,
        beneficiarioNombre: form.beneficiarioNombre.trim() || undefined,
        banco: form.banco.trim() || undefined,
        numeroCuenta: form.numeroCuenta.trim() || undefined,
        nota: form.nota.trim() || undefined,
      });
      setOpen(false);
      setForm({
        concepto: "",
        monto: "",
        fechaProgramada: "",
        proyectoId: "",
        beneficiarioNombre: "",
        banco: "",
        numeroCuenta: "",
        nota: "",
      });
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear el recordatorio",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nuevo recordatorio
      </Button>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-foreground/25 p-0 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuevo-recordatorio-title"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-xl rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="nuevo-recordatorio-title"
              className="text-base font-semibold"
            >
              Nuevo recordatorio de pago
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Solo concepto, monto, fecha y centro son obligatorios.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cerrar
          </Button>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Concepto</span>
            <Input
              autoFocus
              value={form.concepto}
              onChange={(e) => set("concepto", e.target.value)}
              placeholder="Ej. Recibo de luz agosto"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Monto (S/)</span>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.monto}
              onChange={(e) => set("monto", e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Fecha programada</span>
            <Input
              type="date"
              value={form.fechaProgramada}
              onChange={(e) => set("fechaProgramada", e.target.value)}
            />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className="text-sm font-medium">Centro de costo</span>
            <select
              value={centroCosto}
              onChange={(e) =>
                setCentroCosto(e.target.value as "obra" | "administracion")
              }
              className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="obra">Obra</option>
              <option value="administracion">Administración / Oficina</option>
            </select>
          </label>
          {centroCosto === "obra" ? (
            <label className="grid min-w-0 gap-1.5">
              <span className="text-sm font-medium">Obra</span>
              <select
                value={form.proyectoId}
                onChange={(e) => set("proyectoId", e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecciona una obra</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.codigo ? `${proyecto.codigo} — ` : ""}
                    {proyecto.nombre}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Se imputará a Administración / Oficina.
            </div>
          )}
          <details className="sm:col-span-2 rounded-lg border border-border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">
              Datos de pago opcionales
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                value={form.beneficiarioNombre}
                onChange={(e) => set("beneficiarioNombre", e.target.value)}
                placeholder="Beneficiario"
              />
              <Input
                value={form.banco}
                onChange={(e) => set("banco", e.target.value)}
                placeholder="Banco"
              />
              <Input
                value={form.numeroCuenta}
                onChange={(e) => set("numeroCuenta", e.target.value)}
                placeholder="Número de cuenta / CCI"
              />
              <Input
                value={form.nota}
                onChange={(e) => set("nota", e.target.value)}
                placeholder="Nota"
              />
            </div>
          </details>
          {error && (
            <p className="sm:col-span-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Crear recordatorio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
