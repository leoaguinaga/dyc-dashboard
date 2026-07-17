import { cookies } from 'next/headers'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { CertificadoTrabajoDocument } from '@/components/pdf/CertificadoTrabajoDocument'
import type { Proyecto } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const API_URL = process.env.API_URL ?? 'http://localhost:3333/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; trabajadorId: string }> },
) {
  const { id, trabajadorId } = await params
  const cookieStore = await cookies()

  const res = await fetch(`${API_URL}/proyectos/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  })

  if (!res.ok) {
    return new Response('Proyecto no encontrado', { status: res.status })
  }

  const proyecto = (await res.json()) as Proyecto
  const asignacion = proyecto.trabajadores?.find((t) => t.trabajadorId === trabajadorId)
  if (!asignacion) {
    return new Response('Trabajador no encontrado en esta obra', { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(CertificadoTrabajoDocument, { proyecto, trabajadorId }) as any)

  const filename = `constancia-${asignacion.trabajador.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
