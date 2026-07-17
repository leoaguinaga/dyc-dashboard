'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Paperclip, Upload, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, API_ORIGIN } from '@/lib/api/client'
import type { CotizacionConHistorial, EstadoCotizacion } from '@/types/api'

const ESTADO_STYLES: Record<EstadoCotizacion, { label: string; cn: string }> = {
  pendiente:      { label: 'Pendiente',     cn: 'bg-muted text-muted-foreground' },
  recibida:       { label: 'Recibida',      cn: 'bg-chart-2/15 text-chart-2' },
  aprobada:       { label: 'Aprobada',      cn: 'bg-chart-2/15 text-chart-2' },
  rechazada:      { label: 'Rechazada',     cn: 'bg-destructive/10 text-destructive' },
  sin_respuesta:  { label: 'Sin respuesta', cn: 'bg-orange-500/15 text-orange-600' },
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  cotizaciones: CotizacionConHistorial[]
}

export function HistorialCotizacionesSection({ cotizaciones }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Historial de cotizaciones ({cotizaciones.length})
      </h2>

      {cotizaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
          <History className="size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no hay cotizaciones registradas para este proveedor
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map((c) => (
            <CotizacionCard key={c.id} cotizacion={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CotizacionCard({ cotizacion: c }: { cotizacion: CotizacionConHistorial }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const estado = ESTADO_STYLES[c.estado]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      const result = await api.upload<{ nombre: string; url: string }>(
        '/solicitudes-cotizacion/cotizaciones/archivos',
        formData,
      )
      await api.post(`/solicitudes-cotizacion/cotizaciones/${c.id}/archivos`, {
        nombre: result.nombre,
        url: result.url,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/cotizaciones/${c.solicitud.id}`}
            className="text-sm font-mono text-primary hover:underline underline-offset-2"
          >
            {c.solicitud.codigo}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Recibida {fmtDate(c.fechaRecibida)}
          </p>
        </div>
        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0', estado.cn)}>
          {estado.label}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Fecha de entrega</dt>
          <dd className="font-medium">{fmtDate(c.fechaEntrega)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Validez</dt>
          <dd className="font-medium">{c.validezDias ? `${c.validezDias} días` : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Condición de pago</dt>
          <dd className="font-medium">{c.condicionPago || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">IGV incluido</dt>
          <dd className="font-medium">{c.incluyeIgv ? 'Sí' : 'No'}</dd>
        </div>
      </dl>

      {c.condicionesServicio && (
        <p className="text-sm text-muted-foreground">{c.condicionesServicio}</p>
      )}

      {c.condicionesPago.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.condicionesPago.map((cp) => (
            <span
              key={cp.id}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {parseFloat(cp.porcentaje)}% · {fmtDate(cp.fecha)}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {c.archivos.map((a) => (
          <a
            key={a.id}
            href={`${API_ORIGIN}${a.url}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground transition-colors duration-[120ms] hover:bg-muted"
          >
            <FileText className="size-3.5" />
            {a.nombre}
          </a>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-[120ms] hover:bg-muted disabled:opacity-50"
        >
          {uploading ? <Upload className="size-3.5 animate-pulse" /> : <Paperclip className="size-3.5" />}
          {uploading ? 'Subiendo…' : 'Adjuntar PDF'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
