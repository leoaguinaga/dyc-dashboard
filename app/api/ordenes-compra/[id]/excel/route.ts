import { cookies } from 'next/headers'
import { renderOcExcel } from '@/components/excel/OcExcelDocument'
import type { OrdenCompra } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const res = await fetch(`${API_URL}/ordenes-compra/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  })
  if (!res.ok) return new Response('Orden de compra no encontrada', { status: res.status })

  const oc = (await res.json()) as OrdenCompra
  const buffer = await renderOcExcel(oc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${oc.numero}.xlsx"`,
    },
  })
}
