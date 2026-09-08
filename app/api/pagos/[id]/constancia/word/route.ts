import { cookies } from "next/headers";
import { renderConstanciaPagoWord } from "@/components/word/ConstanciaPagoWordDocument";
import type { Pago } from "@/types/api";

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
  if (pago.estado !== "pagado")
    return new Response(
      "La constancia solo está disponible para pagos realizados",
      { status: 409 },
    );

  const buffer = await renderConstanciaPagoWord(pago);
  const referencia = (pago.numeroOperacion || pago.id.slice(-8)).replace(
    /[^a-zA-Z0-9-_]/g,
    "-",
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="constancia-pago-${referencia}.docx"`,
    },
  });
}
