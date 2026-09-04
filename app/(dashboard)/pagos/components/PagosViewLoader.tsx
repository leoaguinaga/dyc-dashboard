import { serverFetch } from "@/lib/api/server";
import type { Pago, PagoRecurrente, Proyecto } from "@/types/api";
import { PagosView } from "./PagosView";

export async function PagosViewLoader() {
  const [pagos, proyectos, pagosFijos] = await Promise.all([
    serverFetch<Pago[]>("/pagos").catch(() => [] as Pago[]),
    serverFetch<Proyecto[]>("/proyectos").catch(() => [] as Proyecto[]),
    serverFetch<PagoRecurrente[]>("/pagos/recurrentes/lista").catch(
      () => [] as PagoRecurrente[],
    ),
  ]);

  return (
    <PagosView pagos={pagos} proyectos={proyectos} pagosFijos={pagosFijos} />
  );
}
