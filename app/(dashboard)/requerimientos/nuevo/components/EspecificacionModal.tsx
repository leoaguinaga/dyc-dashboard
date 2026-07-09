'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface EspecificacionArchivo {
  nombre: string
  url: string
}

export interface EspecificacionData {
  descripcion: string
  archivos: EspecificacionArchivo[]
}

interface ArchivoRow {
  id: string
  nombre: string
  url?: string
  uploading: boolean
  error?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: EspecificacionData | null
  onSave: (data: EspecificacionData) => void
}

function emptyRow(): ArchivoRow {
  return { id: crypto.randomUUID(), nombre: '', uploading: false }
}

export function EspecificacionModal({ open, onOpenChange, initial, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agrega la especificación</DialogTitle>
        </DialogHeader>
        {open && (
          <EspecificacionForm
            initial={initial}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EspecificacionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: EspecificacionData | null
  onSave: (data: EspecificacionData) => void
  onCancel: () => void
}) {
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [archivos, setArchivos] = useState<ArchivoRow[]>(() =>
    initial?.archivos.length
      ? initial.archivos.map((a) => ({ id: crypto.randomUUID(), nombre: a.nombre, url: a.url, uploading: false }))
      : [emptyRow()],
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeRowId = useRef<string | null>(null)

  function updateRow(id: string, patch: Partial<ArchivoRow>) {
    setArchivos((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function triggerUpload(id: string) {
    activeRowId.current = id
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const rowId = activeRowId.current
    e.target.value = ''
    if (!file || !rowId) return

    if (file.type !== 'application/pdf') {
      updateRow(rowId, { error: 'Solo se permiten archivos PDF' })
      return
    }

    updateRow(rowId, { uploading: true, error: undefined })
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      const result = await api.upload<{ nombre: string; url: string }>('/requerimientos/archivos', formData)
      setArchivos((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, uploading: false, url: result.url, nombre: r.nombre || result.nombre } : r,
        ),
      )
    } catch (err) {
      updateRow(rowId, {
        uploading: false,
        error: err instanceof Error ? err.message : 'Error al subir el archivo',
      })
    }
  }

  function removeRow(id: string) {
    setArchivos((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((r) => r.id !== id)))
  }

  function addRow() {
    setArchivos((prev) => [...prev, emptyRow()])
  }

  function handleSave() {
    onSave({
      descripcion: descripcion.trim(),
      archivos: archivos
        .filter((r) => r.url)
        .map((r) => ({ nombre: r.nombre.trim() || 'Documento', url: r.url! })),
    })
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Describe la especificación…"
        autoFocus
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Carga de archivos</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="space-y-1.5">
          {archivos.map((row) => (
            <div key={row.id}>
              <div className="flex items-center gap-2">
                <Input
                  value={row.nombre}
                  onChange={(e) => updateRow(row.id, { nombre: e.target.value })}
                  placeholder="Ej: Ficha técnica"
                  disabled={row.uploading}
                  className="flex-1"
                />
                {row.url ? (
                  <span className="inline-flex h-8 shrink-0 items-center rounded-lg border border-border px-2.5 text-xs text-muted-foreground">
                    Subido
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={row.uploading}
                    onClick={() => triggerUpload(row.id)}
                  >
                    <Upload className="size-3.5" />
                    {row.uploading ? 'Subiendo…' : 'Subir'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(row.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              {row.error && <p className="mt-0.5 text-xs text-destructive">{row.error}</p>}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-ring hover:text-foreground transition-colors duration-[120ms]"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" disabled={!descripcion.trim()} onClick={handleSave}>
          Agregar
        </Button>
      </div>
    </div>
  )
}
