'use client'

import { useEffect, useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'
import type { EntidadesResponse, FiltroReporte, MetricaReporte, QueryReporteDinamico, ResultadoReporte } from '@/lib/reportes/tipos'
import { EntidadPicker } from './EntidadPicker'
import { FiltroForm, type FiltroState } from './FiltroForm'
import { AgruparYMetricasForm, type MetricaState } from './AgruparYMetricasForm'
import { ResultadosTable } from './ResultadosTable'
import { ResultadosChart } from './ResultadosChart'
import { ExportButton } from './ExportButton'

export function ConstructorReportes() {
  const [entidades, setEntidades] = useState<EntidadesResponse['entidades']>({})
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true)
  const [entidad, setEntidad] = useState<string>()
  const [filtros, setFiltros] = useState<FiltroState[]>([])
  const [agruparPor, setAgruparPor] = useState<string[]>([])
  const [metricas, setMetricas] = useState<MetricaState[]>([])
  const [resultado, setResultado] = useState<ResultadoReporte>()
  const [ejecutando, setEjecutando] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    api
      .get<EntidadesResponse>('/reportes/entidades')
      .then((res) => {
        setEntidades(res.entidades)
        setEntidad((prev) => prev ?? Object.keys(res.entidades)[0])
      })
      .catch(() => setError('No se pudo cargar el catálogo de entidades'))
      .finally(() => setCargandoCatalogo(false))
  }, [])

  const meta = entidad ? entidades[entidad] : undefined

  function cambiarEntidad(nuevaEntidad: string) {
    setEntidad(nuevaEntidad)
    setFiltros([])
    setAgruparPor([])
    setMetricas([])
    setResultado(undefined)
    setError(undefined)
  }

  function construirQuery(): QueryReporteDinamico | undefined {
    if (!entidad) return undefined
    const filtrosValidos: FiltroReporte[] = filtros
      .filter((f) => f.valor !== undefined && f.valor !== '' && !(Array.isArray(f.valor) && f.valor.length === 0))
      .map((f) => ({ campo: f.campo, operador: f.operador, valor: f.valor }))
    const metricasValidas: MetricaReporte[] = metricas.map((m) => ({ campo: m.campo, funcion: m.funcion }))
    return {
      entidad,
      filtros: filtrosValidos.length > 0 ? filtrosValidos : undefined,
      agruparPor: agruparPor.length > 0 ? agruparPor : undefined,
      metricas: metricasValidas.length > 0 ? metricasValidas : undefined,
    }
  }

  async function ejecutar() {
    const query = construirQuery()
    if (!query) return
    setEjecutando(true)
    setError(undefined)
    try {
      const res = await api.post<ResultadoReporte>('/reportes/query', query)
      setResultado(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al ejecutar el reporte')
    } finally {
      setEjecutando(false)
    }
  }

  if (cargandoCatalogo) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <EntidadPicker entidades={entidades} value={entidad} onValueChange={cambiarEntidad} />

        {meta && (
          <>
            <FiltroForm campos={meta.campos} filtros={filtros} onChange={setFiltros} />
            <AgruparYMetricasForm
              campos={meta.campos}
              agruparPor={agruparPor}
              onAgruparPorChange={setAgruparPor}
              metricas={metricas}
              onMetricasChange={setMetricas}
            />
          </>
        )}

        <div className="flex items-center gap-2">
          <Button type="button" onClick={ejecutar} disabled={!entidad || ejecutando}>
            {ejecutando ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Ejecutar reporte
          </Button>
          {resultado && construirQuery() && <ExportButton query={construirQuery()!} />}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {resultado && (
        <div className="space-y-4">
          <ResultadosChart resultado={resultado} />
          <ResultadosTable resultado={resultado} />
        </div>
      )}
    </div>
  )
}
