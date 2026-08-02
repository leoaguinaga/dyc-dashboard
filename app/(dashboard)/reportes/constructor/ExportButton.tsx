'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/lib/api/client'
import type { QueryReporteDinamico } from '@/lib/reportes/tipos'

export function ExportButton({ query, disabled }: { query: QueryReporteDinamico; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function exportar() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/reportes/query/export`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${query.entidad}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={exportar} disabled={disabled || loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      Exportar a Excel
    </Button>
  )
}
