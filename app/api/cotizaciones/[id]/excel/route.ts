import { cookies } from 'next/headers'
import { renderCuadroComparativoExcel } from '@/components/excel/CuadroComparativoExcelDocument'
import type { SolicitudCotizacion } from '@/types/api'

const API_URL = process.env.API_URL ?? 'http://localhost:3333/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const res = await fetch(`${API_URL}/solicitudes-cotizacion/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  })
  if (!res.ok) return new Response('Solicitud de cotización no encontrada', { status: res.status })

  const solicitud = (await res.json()) as SolicitudCotizacion
  const buffer = await renderCuadroComparativoExcel(solicitud)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Cuadro comparativo - ${solicitud.codigo}.xlsx"`,
    },
  })
}
