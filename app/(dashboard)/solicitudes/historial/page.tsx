import { serverFetch } from "@/lib/api/server";
import type { SolicitudResumen, SolicitudesResponse } from "@/types/api";
import { SolicitudesHistorialView } from "./components/SolicitudesHistorialView";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

function cargar(origen: "macro" | "precotizado") {
  return serverFetch<SolicitudesResponse>(
    `/solicitudes?vista=historial&origen=${origen}&limit=100&alcance=rol`,
  )
    .then((res): SolicitudResumen[] => res.data)
    .catch(() => null);
}

export default async function SolicitudesHistorialPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const [macro, precotizadas] = await Promise.all([
    cargar("macro"),
    cargar("precotizado"),
  ]);

  return (
    <SolicitudesHistorialView
      macro={macro}
      precotizadas={precotizadas}
      tabInicial={tab === "precotizadas" ? "precotizadas" : "macro"}
    />
  );
}
