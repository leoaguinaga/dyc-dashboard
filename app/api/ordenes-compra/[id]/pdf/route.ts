import { cookies } from 'next/headers'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { OcPdfDocument } from '@/components/pdf/OcPdfDocument'
import type { OrdenCompra } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const API_URL = process.env.API_URL ?? 'http://localhost:3333/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cookieStore = await cookies()

  const res = await fetch(`${API_URL}/ordenes-compra/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  })

  if (!res.ok) {
    return new Response('Orden de compra no encontrada', { status: res.status })
  }

  const oc = (await res.json()) as OrdenCompra

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(OcPdfDocument, { oc }) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${oc.numero}.pdf"`,
    },
  })
}
