'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth/session'
import type { CompraSimpleGrupoArchivo, EstadoAprobacionCompra } from '@/types/api'

interface Props {
  grupoId: string
  archivos: CompraSimpleGrupoArchivo[]
  estadoAprobacion: EstadoAprobacionCompra | null | undefined
  creadoPorId: string
  esRendicion?: boolean
}

export function GrupoFacturaSection({ grupoId, archivos, estadoAprobacion, creadoPorId, esRendicion }: Props) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const puedeSubir =
    (estadoAprobacion === 'aprobada' || (esRendicion && estadoAprobacion === 'pendiente')) &&
    userId === creadoPorId
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setError('Solo se permiten archivos PDF o imágenes')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      await api.upload(`/compras-simples/grupos/${grupoId}/archivos`, formData)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  if (archivos.length === 0 && !puedeSubir) return null

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {esRendicion ? 'Comprobante de compra' : 'Factura'}
      </h3>

      {archivos.length > 0 && (
        <ul className="space-y-1.5">
          {archivos.map((a) => (
            <li key={a.id}>
              <a
                href={`${API_ORIGIN}${a.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
              >
                <FileText className="size-3.5 shrink-0" />
                {a.nombreOriginal}
                {a.tipo === 'foto_producto' && (
                  <span className="text-xs text-muted-foreground">(foto de producto)</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {puedeSubir && (
        <div className="space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            {uploading ? 'Subiendo…' : 'Adjuntar factura (opcional)'}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
