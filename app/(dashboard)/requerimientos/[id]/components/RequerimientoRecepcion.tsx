'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth/session'
import type { Requerimiento } from '@/types/api'

interface Props {
  requerimiento: Requerimiento
}

export function RequerimientoRecepcion({ requerimiento: r }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const router = useRouter()

  const [fotoUrl, setFotoUrl] = useState('')
  const [comentario, setComentario] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esResponsable =
    r.creadoPorId === session?.user?.id || role === 'administrador' || role === 'admin_ti'

  if (r.estado === 'recibido') {
    return (
      <div className="rounded-xl border border-border bg-white p-5 space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recepción confirmada</h2>
        {r.recepcionFotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.recepcionFotoUrl} alt="Foto de recepción" className="w-full max-w-sm rounded-lg border border-border" />
        )}
        {r.recepcionComentario && <p className="text-sm text-muted-foreground">{r.recepcionComentario}</p>}
        <p className="text-xs text-muted-foreground">
          Confirmado por {r.recepcionPor?.name ?? 'el solicitante'}
          {r.recepcionEn && ` el ${new Date(r.recepcionEn).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        </p>
      </div>
    )
  }

  if (r.estado !== 'pendiente_conformidad' || !esResponsable) return null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WEBP')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('foto', file)
      const result = await api.upload<{ url: string }>('/requerimientos/fotos', formData)
      setFotoUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  async function confirmar() {
    if (!fotoUrl) {
      setError('Debes adjuntar una foto de la recepción')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post(`/requerimientos/${r.id}/recepcion`, { fotoUrl, comentario: comentario.trim() || undefined })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la recepción')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confirmar recepción</h2>
      <p className="text-sm text-muted-foreground">
        La compra de este requerimiento ya fue recibida. Subí una foto y dejá tus comentarios para cerrar el requerimiento.
      </p>

      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt="Foto de recepción" className="w-full max-w-sm rounded-lg border border-border" />
      ) : (
        <label className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-5 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
          {uploading ? <Upload className="size-5 animate-pulse" /> : <Camera className="size-5" />}
          {uploading ? 'Subiendo…' : 'Subir foto de la recepción'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      )}

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Comentarios sobre la recepción (opcional)…"
        rows={3}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms] resize-none"
      />

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button className="w-full" disabled={saving || uploading || !fotoUrl} onClick={confirmar}>
        {saving ? 'Confirmando…' : 'Confirmar recepción'}
      </Button>
    </div>
  )
}
