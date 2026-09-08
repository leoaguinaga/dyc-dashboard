import { cookies } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ConstanciaPagoDocument } from "@/components/pdf/ConstanciaPagoDocument";
import type { Pago } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? "http://localhost:3333/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/pagos/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!res.ok)
    return new Response("Pago no encontrado", { status: res.status });

  const pago = (await res.json()) as Pago;
  if (pago.estado !== "pagado") {
    return new Response(
      "La constancia solo está disponible para pagos realizados",
      { status: 409 },
    );
  }

  const buffer = await renderToBuffer(
    React.createElement(ConstanciaPagoDocument, {
      pago,
      generadoEn: new Date().toISOString(),
    }) as unknown as Parameters<typeof renderToBuffer>[0],
  );
  const referencia = (pago.numeroOperacion || pago.id.slice(-8)).replace(
    /[^a-zA-Z0-9-_]/g,
    "-",
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="constancia-pago-${referencia}.pdf"`,
    },
  });
}
