import { GenericResultTable } from '@/components/shared/GenericResultTable'
import type { ResultadoReporte } from '@/lib/reportes/tipos'

export function ResultadosTable({ resultado }: { resultado: ResultadoReporte }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{resultado.filas.length} fila{resultado.filas.length === 1 ? '' : 's'}</p>
      <GenericResultTable resultado={resultado} />
    </div>
  )
}
