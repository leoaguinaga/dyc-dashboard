export type TipoCampo = 'string' | 'number' | 'decimal' | 'date' | 'boolean' | 'enum' | 'relacion'

export type OperadorFiltro =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'between'

export type FuncionMetrica = 'count' | 'sum' | 'avg' | 'min' | 'max'

export interface CampoReporte {
  key: string
  label: string
  tipo: TipoCampo
  path: string[]
  enumValues?: string[]
  operadores: OperadorFiltro[]
  agrupable?: boolean
  metrica?: boolean
  relacion?: {
    entidad: string
    labelField: string
  }
  virtual?: {
    transform: 'mesTruncado'
  }
}

export interface ReporteEntidadMeta {
  entidad: string
  label: string
  campos: CampoReporte[]
  campoFechaDefault?: string
}

export interface FiltroReporte {
  campo: string
  operador: OperadorFiltro
  valor: unknown
}

export interface MetricaReporte {
  campo: string
  funcion: FuncionMetrica
}

export interface QueryReporteDinamico {
  entidad: string
  filtros?: FiltroReporte[]
  agruparPor?: string[]
  metricas?: MetricaReporte[]
  columnas?: string[]
  limite?: number
}

export interface ColumnaReporte {
  key: string
  label: string
  tipo: TipoCampo | 'number'
}

export interface ResultadoReporte {
  columnas: ColumnaReporte[]
  filas: Record<string, unknown>[]
}

export interface EntidadesResponse {
  entidades: Record<string, ReporteEntidadMeta>
  presets: Record<string, QueryReporteDinamico>
}

export const OPERADOR_LABEL: Record<OperadorFiltro, string> = {
  eq: 'es igual a',
  neq: 'es distinto de',
  gt: 'mayor que',
  gte: 'mayor o igual que',
  lt: 'menor que',
  lte: 'menor o igual que',
  contains: 'contiene',
  in: 'está en',
  between: 'entre',
}

export const FUNCION_METRICA_LABEL: Record<FuncionMetrica, string> = {
  count: 'contar',
  sum: 'sumar',
  avg: 'promedio',
  min: 'mínimo',
  max: 'máximo',
}

/** Mapeo entidad relacionada -> endpoint REST, usado por el combobox genérico de relaciones. */
export const ENDPOINT_POR_ENTIDAD_RELACION: Record<string, { endpoint: string; labelField: string }> = {
  proyecto: { endpoint: '/proyectos', labelField: 'nombre' },
  proveedor: { endpoint: '/proveedores', labelField: 'razonSocial' },
  cliente: { endpoint: '/clientes', labelField: 'razonSocial' },
  trabajador: { endpoint: '/trabajadores', labelField: 'nombre' },
  usuario: { endpoint: '/users', labelField: 'name' },
  requerimiento: { endpoint: '/requerimientos', labelField: 'codigo' },
  solicitudCotizacion: { endpoint: '/solicitudes-cotizacion', labelField: 'codigo' },
  ordenCompra: { endpoint: '/ordenes-compra', labelField: 'numero' },
}
