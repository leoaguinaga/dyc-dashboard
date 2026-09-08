"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckIcon,
  ChevronRightIcon,
  GitBranchIcon,
  LockKeyholeIcon,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrabajadorCombobox } from "@/components/ui/trabajador-combobox";
import { PERU_UBIGEO } from "@/lib/peru-ubigeo";
import type {
  Cliente,
  ContactoCliente,
  Proyecto,
  Trabajador,
} from "@/types/api";

interface Props {
  clientes: Cliente[];
  trabajadores: Trabajador[];
  proyectos: Proyecto[];
}

function getCurrentLimaYear(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
  }).formatToParts(new Date());
  const yearPart = parts.find((p) => p.type === "year")?.value;
  return yearPart ? Number(yearPart) : new Date().getFullYear();
}

const currentYear = getCurrentLimaYear();
const ANIOS_DISPONIBLES = [
  currentYear,
  currentYear - 1,
  currentYear - 2,
  currentYear + 1,
];

type FormData = {
  anio: number;
  correlativo: string;
  nombre: string;
  parentId: string;
  clienteId: string;
  ambitoGeografico: string;
  ciudad: string;
  direccion: string;
  comuna: string;
  enlaceOneDrive: string;
  coordinadorClienteId: string;
  coordinadorEmpresaId: string;
  ejecutorId: string;
  prevencionistaId: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioReal: string;
  fechaFinReal: string;
  notaInicioReal: string;
  estado: Proyecto["estado"];
};

const initial: FormData = {
  anio: currentYear,
  correlativo: "",
  nombre: "",
  parentId: "",
  clienteId: "",
  ambitoGeografico: "local",
  ciudad: "",
  direccion: "",
  comuna: "",
  enlaceOneDrive: "",
  coordinadorClienteId: "",
  coordinadorEmpresaId: "",
  ejecutorId: "",
  prevencionistaId: "",
  fechaInicio: "",
  fechaFin: "",
  fechaInicioReal: "",
  fechaFinReal: "",
  notaInicioReal: "",
  estado: "planificacion",
};

const labelCn = "mb-1.5 block text-sm font-medium";
const sectionTitleCn =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";

function yearRegistro2Digitos(anio: number) {
  const s = String(anio);
  return s.length === 2 ? s : s.slice(-2);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function correlativoProyectoPrincipal(codigo: string, year: string) {
  const codigoActual = codigo.match(/^(\d{2})-(\d+)(?:-\d+)?$/);
  if (codigoActual?.[1] === year) return Number(codigoActual[2]);

  const codigoHistorico = codigo.match(/^(\d+)-(?:ING|MAN)-(\d{2})$/);
  if (codigoHistorico?.[2] === year) return Number(codigoHistorico[1]);

  return null;
}

function sugerirCodigo(
  proyectos: Proyecto[],
  anio: number,
  parentId: string,
) {
  if (parentId) {
    const parent = proyectos.find((proyecto) => proyecto.id === parentId);
    if (!parent?.codigo) return null;

    const matchNuevo = parent.codigo.match(/^(\d{2}-\d{2})-(\d{2})$/);
    if (matchNuevo) {
      const basePrefix = matchNuevo[1];
      const parentSubIndex = matchNuevo[2] ? Number(matchNuevo[2]) : 0;
      const subproyectos = proyectos.filter((p) => p.parentId === parentId);
      const subPatron = new RegExp(`^${escapeRegExp(basePrefix)}-(\\d+)$`);
      let maxIndex = parentSubIndex;
      for (const sp of subproyectos) {
        const m = sp.codigo?.match(subPatron);
        if (m) {
          maxIndex = Math.max(maxIndex, Number(m[1]));
        }
      }
      const nextIndex = maxIndex + 1;
      return `${basePrefix}-${String(nextIndex).padStart(2, "0")}`;
    }

    const patron = new RegExp(`^${escapeRegExp(parent.codigo)}\\.(\\d+)$`);
    const ultimoSufijo = proyectos
      .filter((proyecto) => proyecto.parentId === parentId)
      .reduce((maximo, proyecto) => {
        const match = proyecto.codigo?.match(patron);
        return match ? Math.max(maximo, Number(match[1])) : maximo;
      }, 0);
    return `${parent.codigo}.${String(ultimoSufijo + 1).padStart(2, "0")}`;
  }

  const year2Dig = yearRegistro2Digitos(anio);
  const ultimoCorrelativo = proyectos
    .filter((proyecto) => !proyecto.parentId)
    .reduce((maximo, proyecto) => {
      const correlativo = proyecto.codigo
        ? correlativoProyectoPrincipal(proyecto.codigo, year2Dig)
        : null;
      return correlativo === null ? maximo : Math.max(maximo, correlativo);
    }, 0);
  return `${year2Dig}-${String(ultimoCorrelativo + 1).padStart(3, "0")}`;
}

type StepErrors = Partial<Record<keyof FormData, string>>;

const STEPS = [
  {
    title: "Identificacion",
    description: "Datos principales del proyecto",
    optional: false,
  },
  {
    title: "Ubicacion",
    description: "Donde se ejecutara el proyecto",
    optional: true,
  },
  {
    title: "Personas asignadas",
    description: "Responsables del proyecto",
    optional: true,
  },
  {
    title: "Fechas",
    description: "Plazos programados y reales",
    optional: true,
  },
];

export function CreateProyectoForm({
  clientes,
  trabajadores,
  proyectos,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<StepErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactos, setContactos] = useState<ContactoCliente[]>([]);
  const [esSubproyecto, setEsSubproyecto] = useState(false);

  const distritos =
    PERU_UBIGEO.find((d) => d.nombre === form.ciudad)?.distritos ?? [];

  const showLocalFields = form.ambitoGeografico === "local";

  const datesDiffer =
    form.fechaInicio &&
    form.fechaInicioReal &&
    form.fechaInicioReal !== form.fechaInicio;

  const codigoSugerido = sugerirCodigo(
    proyectos,
    form.anio,
    form.parentId,
  );
  const year2Dig = yearRegistro2Digitos(form.anio);
  const correlativoElegido = Number(form.correlativo);
  const tieneCorrelativoElegido =
    !esSubproyecto &&
    Number.isInteger(correlativoElegido) &&
    correlativoElegido > 0;
  const correlativoOcupado =
    tieneCorrelativoElegido &&
    proyectos.some(
      (proyecto) =>
        !proyecto.parentId &&
        proyecto.codigo &&
        correlativoProyectoPrincipal(proyecto.codigo, year2Dig) ===
          correlativoElegido,
    );
  const codigoMostrado = tieneCorrelativoElegido
    ? `${year2Dig}-${String(correlativoElegido).padStart(3, "0")}`
    : codigoSugerido;

  const proyectosPadre = proyectos.filter(
    (proyecto) => !proyecto.parentId && Boolean(proyecto.codigo),
  );

  function set(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleClienteChange(clienteId: string) {
    set("clienteId", clienteId);
    set("coordinadorClienteId", "");
    if (!clienteId) {
      setContactos([]);
      return;
    }
    const data = await api
      .get<ContactoCliente[]>(`/clientes/${clienteId}/contactos`)
      .catch(() => []);
    setContactos(data);
  }

  function handleDepartamentoChange(depto: string) {
    set("ciudad", depto);
    set("comuna", "");
  }

  function handleAmbitoChange(ambito: string) {
    set("ambitoGeografico", ambito);
    if (ambito !== "local") {
      set("ciudad", "");
      set("comuna", "");
    }
  }

  function handleTipoProyecto(subproyecto: boolean) {
    setEsSubproyecto(subproyecto);
    setForm((prev) => ({
      ...prev,
      parentId: "",
      anio: currentYear,
      correlativo: "",
    }));
    setErrors((prev) => ({
      ...prev,
      parentId: undefined,
      anio: undefined,
    }));
  }

  function handleParentChange(parentId: string) {
    const parent = proyectos.find((proyecto) => proyecto.id === parentId);
    let parentYear = form.anio;
    if (parent?.codigo) {
      const match = parent.codigo.match(/^(\d{2})-\d{2}/);
      if (match) {
        parentYear = 2000 + Number(match[1]);
      }
    }
    setForm((prev) => ({
      ...prev,
      parentId,
      anio: parentYear,
    }));
    setErrors((prev) => ({
      ...prev,
      parentId: undefined,
      anio: undefined,
    }));
  }

  function validateStep(idx: number): StepErrors {
    const next: StepErrors = {};
    if (idx === 0) {
      if (esSubproyecto && !form.parentId)
        next.parentId = "Selecciona el proyecto padre";
      if (!esSubproyecto && !form.anio)
        next.anio = "Selecciona el año del proyecto";
      if (
        !esSubproyecto &&
        form.correlativo &&
        (!Number.isInteger(correlativoElegido) || correlativoElegido < 1)
      )
        next.correlativo = "Ingresa un número entero mayor que cero";
      if (!esSubproyecto && correlativoOcupado)
        next.correlativo = `El correlativo ${correlativoElegido} ya está ocupado`;
      if (!form.nombre.trim()) next.nombre = "El nombre es requerido";
      if (!form.clienteId) next.clienteId = "El cliente es requerido";
    }
    if (idx === 3) {
      if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio)
        next.fechaFin = "La fecha fin no puede ser anterior al inicio";
      if (
        form.fechaInicioReal &&
        form.fechaFinReal &&
        form.fechaFinReal < form.fechaInicioReal
      )
        next.fechaFinReal =
          "La fecha fin real no puede ser anterior al inicio real";
      if (datesDiffer && !form.notaInicioReal.trim())
        next.notaInicioReal =
          "Explica la diferencia entre la fecha programada y la real";
    }
    return next;
  }

  function goNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    submit();
  }

  function goBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function skip() {
    setErrors({});
    setStep((s) => s + 1);
  }

  async function submit() {
    setLoading(true);
    setServerError(null);
    try {
      const payload: Record<string, unknown> = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ""),
      );
      if (form.correlativo) payload.correlativo = Number(form.correlativo);
      await api.post<Proyecto>("/proyectos", payload);
      router.push("/proyectos");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-8">
      {/* Stepper header */}
      <div>
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => {
                  if (i < step) {
                    setErrors({});
                    setStep(i);
                  }
                }}
                disabled={i > step}
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                  borderColor:
                    i < step
                      ? "var(--primary)"
                      : i === step
                        ? "var(--primary)"
                        : "var(--border)",
                  backgroundColor:
                    i < step
                      ? "var(--primary)"
                      : i === step
                        ? "var(--primary)"
                        : "transparent",
                  color:
                    i <= step
                      ? "var(--primary-foreground)"
                      : "var(--muted-foreground)",
                }}
                aria-label={s.title}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? <CheckIcon className="size-3.5" /> : i + 1}
              </button>

              {i < STEPS.length - 1 && (
                <div
                  className="h-px flex-1 mx-2 transition-colors"
                  style={{
                    backgroundColor:
                      i < step ? "var(--primary)" : "var(--border)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{STEPS[step].title}</p>
            {STEPS[step].optional && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Opcional
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {STEPS[step].description}
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="">
        {/* Step 1 — Identificacion */}
        {step === 0 && (
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className={labelCn}>Tipo de proyecto</legend>
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                role="group"
                aria-label="Tipo de proyecto"
              >
                <button
                  type="button"
                  onClick={() => handleTipoProyecto(false)}
                  aria-pressed={!esSubproyecto}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left transition-[border-color,background-color,box-shadow] duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    !esSubproyecto
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="block text-sm font-medium">
                    Proyecto principal
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Recibe un nuevo correlativo anual
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoProyecto(true)}
                  aria-pressed={esSubproyecto}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left transition-[border-color,background-color,box-shadow] duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    esSubproyecto
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <GitBranchIcon className="size-3.5" /> Subproyecto
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Hereda el código de un proyecto padre
                  </span>
                </button>
              </div>
            </fieldset>

            {esSubproyecto && (
              <div>
                <label className={labelCn}>
                  Proyecto padre <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.parentId}
                  onValueChange={(v) => handleParentChange(v ?? "")}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!errors.parentId}
                  >
                    <SelectValue placeholder="Seleccionar proyecto padre...">
                      {(value: string) => {
                        const parent = proyectos.find(
                          (proyecto) => proyecto.id === value,
                        );
                        return parent
                          ? `${parent.codigo} — ${parent.nombre}`
                          : "Seleccionar proyecto padre...";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {proyectosPadre.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.codigo} — {proyecto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentId && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.parentId}
                  </p>
                )}
                {proyectosPadre.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No hay proyectos principales disponibles.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>
                  Año del proyecto <span className="text-destructive">*</span>
                </label>
                <Select
                  value={String(form.anio)}
                  onValueChange={(v) =>
                    set("anio", v ? Number(v) : currentYear)
                  }
                  disabled={esSubproyecto}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!errors.anio}
                  >
                    <SelectValue
                      placeholder={
                        esSubproyecto
                          ? "Se hereda del proyecto padre"
                          : "Seleccionar año..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIOS_DISPONIBLES.map((yr) => (
                      <SelectItem key={yr} value={String(yr)}>
                        Año {yr} ({String(yr).slice(-2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.anio && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.anio}
                  </p>
                )}
                {esSubproyecto && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    El año se hereda automáticamente del proyecto padre.
                  </p>
                )}
                {!esSubproyecto && (
                  <div className="mt-4">
                    <label className={labelCn}>Número del proyecto</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={form.correlativo}
                      onChange={(e) => set("correlativo", e.target.value)}
                      placeholder={`Sugerido: ${codigoSugerido?.split("-")[1] ?? "—"}`}
                      aria-invalid={!!errors.correlativo || correlativoOcupado}
                    />
                    {errors.correlativo || correlativoOcupado ? (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.correlativo ??
                          `El correlativo ${correlativoElegido} ya está ocupado`}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Déjalo vacío para usar el sugerido por el sistema.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className={labelCn}>
                  Nombre del proyecto{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej. Edificio Costanera Norte"
                  aria-invalid={!!errors.nombre}
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.nombre}
                  </p>
                )}
              </div>
            </div>

            <div
              className="rounded-xl bg-muted/45 px-4 py-3.5"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Código que asignará el sistema
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums">
                    {codigoMostrado ?? "Pendiente de completar"}
                  </p>
                </div>
                <LockKeyholeIcon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {esSubproyecto
                  ? "El año y correlativo base se heredan del padre. El último segmento identifica el subproyecto."
                  : "Puedes elegir el número del proyecto o dejar el sugerido. Al guardar, el sistema valida que no esté ocupado."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>
                  Cliente <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.clienteId}
                  onValueChange={(v) => handleClienteChange(v ?? "")}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!errors.clienteId}
                  >
                    <SelectValue placeholder="Seleccionar cliente...">
                      {(value: string) => {
                        const c = clientes.find((x) => x.id === value);
                        return c
                          ? (c.nombreComercial ?? c.razonSocial)
                          : "Seleccionar cliente...";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombreComercial ?? c.razonSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clienteId && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.clienteId}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCn}>Estado</label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => set("estado", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planificacion">Planificacion</SelectItem>
                    <SelectItem value="ejecucion">Ejecucion</SelectItem>
                    <SelectItem value="cierre">Cierre</SelectItem>
                    <SelectItem value="liquidada">Liquidada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Ubicacion */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCn}>Ambito geografico</label>
              <Select
                value={form.ambitoGeografico}
                onValueChange={(v) => handleAmbitoChange(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    Local (departamento/distrito)
                  </SelectItem>
                  <SelectItem value="nacional">Nacional</SelectItem>
                  <SelectItem value="internacional">Internacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showLocalFields && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>Departamento</label>
                  <Select
                    value={form.ciudad}
                    onValueChange={(v) => handleDepartamentoChange(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar departamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PERU_UBIGEO.map((d) => (
                        <SelectItem key={d.nombre} value={d.nombre}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCn}>Distrito</label>
                  <Select
                    value={form.comuna}
                    onValueChange={(v) => set("comuna", v ?? "")}
                    disabled={!form.ciudad}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          form.ciudad
                            ? "Seleccionar distrito..."
                            : "Elige un departamento primero"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {distritos.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <label className={labelCn}>Direccion</label>
              <Input
                value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                placeholder="Ej. Panamericana Norte Km 754"
              />
            </div>

            <div>
              <label className={labelCn}>Enlace a carpeta de OneDrive</label>
              <Input
                type="url"
                value={form.enlaceOneDrive}
                onChange={(e) => set("enlaceOneDrive", e.target.value)}
                placeholder="https://onedrive.live.com/..."
              />
            </div>
          </div>
        )}

        {/* Step 3 — Personas asignadas */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>Coordinador del cliente</label>
                <Select
                  value={form.coordinadorClienteId}
                  onValueChange={(v) => set("coordinadorClienteId", v ?? "")}
                  disabled={!form.clienteId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        form.clienteId
                          ? "Sin asignar"
                          : "Sin cliente seleccionado"
                      }
                    >
                      {(value: string) => {
                        const c = contactos.find((x) => x.id === value);
                        return c
                          ? `${c.nombre}${c.cargo ? ` — ${c.cargo}` : ""}`
                          : null;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {contactos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                        {c.cargo ? ` — ${c.cargo}` : ""}
                      </SelectItem>
                    ))}
                    {contactos.length === 0 && form.clienteId && (
                      <SelectItem value="__none__" disabled>
                        Sin contactos registrados
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCn}>Coordinador de la empresa</label>
                <TrabajadorCombobox
                  trabajadores={trabajadores}
                  value={form.coordinadorEmpresaId}
                  onValueChange={(v) => set("coordinadorEmpresaId", v)}
                  placeholder="Seleccionar coordinador..."
                />
              </div>
              <div>
                <label className={labelCn}>Ejecutor</label>
                <TrabajadorCombobox
                  trabajadores={trabajadores}
                  value={form.ejecutorId}
                  onValueChange={(v) => set("ejecutorId", v)}
                  placeholder="Seleccionar ejecutor..."
                />
              </div>
              <div>
                <label className={labelCn}>
                  Prevencionista asignado{" "}
                  <span className="text-muted-foreground font-normal">
                    (encargado de asistencia)
                  </span>
                </label>
                <TrabajadorCombobox
                  trabajadores={trabajadores}
                  value={form.prevencionistaId}
                  onValueChange={(v) => set("prevencionistaId", v)}
                  placeholder="Seleccionar prevencionista..."
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <h3 className={sectionTitleCn}>Turnos de horario</h3>
              <p className="text-xs text-muted-foreground">
                Los turnos de asistencia (mañana, tarde, noche) se configuran
                después de crear el proyecto, desde &quot;Editar proyecto&quot;.
              </p>
            </div>
          </div>
        )}

        {/* Step 4 — Fechas */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>Inicio programado</label>
                <DatePicker
                  value={form.fechaInicio}
                  onValueChange={(v) => set("fechaInicio", v ?? "")}
                  placeholder="Seleccionar fecha"
                />
              </div>
              <div>
                <label className={labelCn}>Fin programado</label>
                <DatePicker
                  value={form.fechaFin}
                  onValueChange={(v) => set("fechaFin", v ?? "")}
                  placeholder="Seleccionar fecha"
                  aria-invalid={!!errors.fechaFin}
                />
                {errors.fechaFin && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.fechaFin}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCn}>
                  Inicio real{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </label>
                <DatePicker
                  value={form.fechaInicioReal}
                  onValueChange={(v) => set("fechaInicioReal", v ?? "")}
                  placeholder="Seleccionar fecha"
                />
              </div>
              <div>
                <label className={labelCn}>
                  Fin real{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </label>
                <DatePicker
                  value={form.fechaFinReal}
                  onValueChange={(v) => set("fechaFinReal", v ?? "")}
                  placeholder="Seleccionar fecha"
                  aria-invalid={!!errors.fechaFinReal}
                />
                {errors.fechaFinReal && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.fechaFinReal}
                  </p>
                )}
              </div>
            </div>

            {datesDiffer && (
              <div>
                <label className={labelCn}>
                  Nota sobre inicio real{" "}
                  <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={form.notaInicioReal}
                  onChange={(e) => set("notaInicioReal", e.target.value)}
                  placeholder="Explica por que la fecha de inicio real difiere de la programada..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms] resize-none"
                  aria-invalid={!!errors.notaInicioReal}
                />
                {errors.notaInicioReal && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.notaInicioReal}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={loading}
            >
              Atras
            </Button>
          )}
          {step === 0 && (
            <Link
              href="/proyectos"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancelar
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {STEPS[step].optional && !isLast && (
            <Button
              type="button"
              variant="ghost"
              onClick={skip}
              disabled={loading}
            >
              Omitir
            </Button>
          )}
          <Button
            type="button"
            onClick={goNext}
            disabled={loading}
            className="min-w-28 gap-1.5"
          >
            {loading ? (
              "Guardando..."
            ) : isLast ? (
              "Crear proyecto"
            ) : (
              <>
                Siguiente <ChevronRightIcon className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
