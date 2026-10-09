import type { UnidadMedida } from '@/types/api'

export interface FilaPegada {
  descripcion: string
  cantidad: string
  /** `null` cuando la unidad pegada no se reconoce y el usuario debe elegirla. */
  unidad: UnidadMedida | null
  unidadOriginal: string
  observacion: string
}

const ALIASES: Record<UnidadMedida, string[]> = {
  und: ['und', 'unid', 'unidad', 'unidades', 'uni', 'u', 'un'],
  pieza: ['pieza', 'piezas', 'pza', 'pzas', 'pz', 'pzs'],
  par: ['par', 'pares', 'pr'],
  juego: ['juego', 'juegos', 'jgo', 'jgos', 'jg'],
  global: ['global', 'glb', 'gbl'],
  kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogramo', 'kilogramos'],
  g: ['g', 'gr', 'grs', 'gramo', 'gramos'],
  m: ['m', 'mt', 'mts', 'metro', 'metros'],
  m2: ['m2', 'mt2', 'mts2', 'metro2', 'metros2', 'metro cuadrado', 'metros cuadrados'],
  m3: ['m3', 'mt3', 'mts3', 'metro3', 'metros3', 'metro cubico', 'metros cubicos'],
  l: ['l', 'lt', 'lts', 'litro', 'litros'],
  ml: ['ml', 'mililitro', 'mililitros'],
  gal: ['gal', 'gl', 'gls', 'galon', 'galones'],
  docena: ['docena', 'docenas', 'dz', 'doc'],
  medio_ciento: ['medio ciento', 'medio_ciento', '1/2 ciento'],
  ciento: ['ciento', 'cientos', 'cto'],
  medio_millar: ['medio millar', 'medio_millar', '1/2 millar'],
  millar: ['millar', 'millares', 'mll'],
  bolsa: ['bolsa', 'bolsas', 'bls', 'bols'],
  caja: ['caja', 'cajas', 'cj', 'cja'],
  rollo: ['rollo', 'rollos', 'rll', 'rlls'],
  balde: ['balde', 'baldes'],
  galonera: ['galonera', 'galoneras'],
  cilindro: ['cilindro', 'cilindros'],
  varilla: ['varilla', 'varillas', 'var'],
  plancha: ['plancha', 'planchas', 'pln'],
  tubo: ['tubo', 'tubos', 'tbo'],
}

const POR_ALIAS = new Map<string, UnidadMedida>()
for (const [unidad, aliases] of Object.entries(ALIASES) as [UnidadMedida, string[]][]) {
  for (const a of aliases) POR_ALIAS.set(a, unidad)
}

function limpiar(valor: string) {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizarUnidad(valor: string): UnidadMedida | null {
  const limpio = limpiar(valor)
  if (!limpio) return null
  return POR_ALIAS.get(limpio) ?? POR_ALIAS.get(limpio.replace(/\.$/, '')) ?? null
}

function normalizarCantidad(valor: string) {
  const limpio = valor.trim().replace(/\s/g, '').replace(',', '.')
  return /^\d*\.?\d+$|^\d+\.$/.test(limpio) ? limpio : ''
}

/** Convierte texto copiado desde Excel (TSV) en filas. Orden esperado: descripción, cantidad, unidad, observaciones. */
export function parsearPegado(texto: string): FilaPegada[] {
  const lineas = texto
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.split('\t'))
    .filter((celdas) => celdas.some((c) => c.trim()))

  const esEncabezado =
    lineas.length > 1 && /descrip|material|item|ítem/i.test(lineas[0][0] ?? '') && !normalizarCantidad(lineas[0][1] ?? '')
  const datos = esEncabezado ? lineas.slice(1) : lineas

  return datos.map((celdas) => {
    const unidadOriginal = (celdas[2] ?? '').trim()
    return {
      descripcion: (celdas[0] ?? '').trim(),
      cantidad: normalizarCantidad(celdas[1] ?? ''),
      unidad: unidadOriginal ? normalizarUnidad(unidadOriginal) : 'und',
      unidadOriginal,
      observacion: (celdas[3] ?? '').trim(),
    }
  })
}

export function esPegadoTabular(texto: string) {
  return /[\t\n]/.test(texto.trim())
}
