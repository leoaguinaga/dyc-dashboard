import type { ResultadoReporte } from '@/lib/reportes/tipos'

function formatCell(tipo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  switch (tipo) {
    case 'decimal':
    case 'number':
      return typeof valor === 'number'
        ? valor.toLocaleString('es-PE', {
            minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
            maximumFractionDigits: 2,
          })
        : String(valor)
    case 'date': {
      const d = new Date(valor as string)
      return Number.isNaN(d.getTime())
        ? String(valor)
        : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    case 'boolean':
      return valor ? 'Sí' : 'No'
    case 'enum':
      return String(valor).replace(/_/g, ' ')
    default:
      return String(valor)
  }
}

export function GenericResultTable({ resultado }: { resultado: ResultadoReporte }) {
  if (resultado.filas.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados para esta combinación de filtros</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            {resultado.columnas.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultado.filas.map((fila, i) => (
            <tr key={i} className="border-t border-border">
              {resultado.columnas.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-3 py-2">
                  {formatCell(c.tipo, fila[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
