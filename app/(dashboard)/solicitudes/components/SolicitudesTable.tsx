import { ClipboardList } from "lucide-react";
import { serverFetch } from "@/lib/api/server";
import type { SolicitudesResponse, User } from "@/types/api";
import { NuevaSolicitudSheet } from "./NuevaSolicitudSheet";
import { SolicitudesView } from "./SolicitudesView";

const ROLES_PRECOTIZADO = [
  "supervisor",
  "supervisor_civil",
  "supervisor_electrico",
  "pdr",
  "administrador",
  "admin_ti",
];

interface Props {
  abrirNuevaSolicitud?: boolean;
}

export async function SolicitudesTable({ abrirNuevaSolicitud = false }: Props) {
  const [result, user] = await Promise.all([
    serverFetch<SolicitudesResponse>(
      "/solicitudes?vista=activas&limit=100",
    ).catch((error: Error) => error),
    serverFetch<User>("/users/me").catch(() => null),
  ]);
  const puedeCrearPrecotizado =
    !!user?.role && ROLES_PRECOTIZADO.includes(user.role);

  if (result instanceof Error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ClipboardList className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">
          No se pudieron cargar las solicitudes
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Vuelve a intentarlo. Tus requerimientos y compras siguen disponibles
          en sus módulos actuales.
        </p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ClipboardList className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Aún no hay solicitudes</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Crea una solicitud y elige si logística debe cotizarla o si ya cuentas
          con proveedor y precios.
        </p>
        <div className="mt-4">
          <NuevaSolicitudSheet
            puedeCrearPrecotizado={puedeCrearPrecotizado}
            defaultOpen={abrirNuevaSolicitud}
          />
        </div>
      </div>
    );
  }

  return (
    <SolicitudesView
      solicitudes={result.data}
      puedeCrearPrecotizado={puedeCrearPrecotizado}
      abrirNuevaSolicitud={abrirNuevaSolicitud}
    />
  );
}
