'use client'

import { useState } from 'react'
import { Check, Copy, FileImage } from 'lucide-react'
import { API_URL } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const TITULO: Record<'pendientes' | 'pagados', string> = {
  pendientes: 'Pagos pendientes',
  pagados: 'Pagos realizados',
}

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function horaActual() {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fechaConBarras(fecha: string) {
  return fecha.replaceAll('-', '/')
}

async function obtenerPng(tipo: 'pendientes' | 'pagados', fecha: string) {
  const res = await fetch(`${API_URL}/pagos/reporte.png?fecha=${fecha}&tipo=${tipo}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('No se pudo generar el reporte')
  const blob = await res.blob()
  const filename = `pagos-${tipo}-${fecha}.png`
  return { blob, filename }
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReporteButton({
  tipo,
  label,
  fecha: fechaProp,
}: {
  tipo: 'pendientes' | 'pagados'
  label: string
  fecha?: string
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [copiado, setCopiado] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const fecha = fechaProp ?? hoyISO()
      const { blob, filename } = await obtenerPng(tipo, fecha)
      descargarBlob(blob, filename)
      setTexto(`Reporte ${TITULO[tipo]} para el ${fechaConBarras(fecha)}, ${horaActual()}`)
      setCopiado(false)
      setOpen(true)
    } catch {
      alert('No se pudo generar el reporte. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function copiarTexto() {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium',
          'hover:bg-muted/40 transition-colors duration-[120ms] disabled:opacity-50',
        )}
      >
        <FileImage className="size-4" />
        {loading ? 'Generando...' : label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reporte descargado</DialogTitle>
            <DialogDescription>
              Copia este texto para acompañar la imagen al enviarla por WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">{texto}</p>
          <DialogFooter>
            <Button onClick={copiarTexto} variant={copiado ? 'outline' : 'default'}>
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiado ? 'Copiado' : 'Copiar texto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
