import type { UnidadMedida } from '@/types/api'

export interface FilaPegada {
  descripcion: string
  cantidad: string
  /** `null` cuando la unidad pegada no se reconoce y el usuario debe elegirla. */
  unidad: UnidadMedida | null
  unidadOriginal: string
  observacion: string
  /** Precio unitario (P.U.); vacío si no viene o no es un número. */
  precio: string
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

/**
 * Divide TSV de Excel en filas de celdas. Excel envuelve entre comillas las celdas con saltos de línea,
 * tabs o comillas (y duplica las comillas internas), así que no basta con separar por `\n`.
 */
function dividirTsv(texto: string): string[][] {
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let entreComillas = false
  const src = texto.replace(/\r\n?/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (entreComillas) {
      if (c === '"' && src[i + 1] === '"') {
        celda += '"'
        i++
      } else if (c === '"') entreComillas = false
      else celda += c
    } else if (c === '"' && celda === '') entreComillas = true
    else if (c === '\t') {
      fila.push(celda)
      celda = ''
    } else if (c === '\n') {
      fila.push(celda)
      filas.push(fila)
      fila = []
      celda = ''
    } else celda += c
  }
  if (celda !== '' || fila.length > 0) {
    fila.push(celda)
    filas.push(fila)
  }
  return filas.filter((celdas) => celdas.some((c) => c.trim()))
}

const unaLinea = (valor: string | undefined, separador: string) =>
  (valor ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(separador)

/**
 * Convierte texto copiado desde Excel (TSV) en filas, con el orden del formato FR-LOG-001:
 * CANT., U.D.M., CONCEPTO/CARACTERÍSTICA, P.U., TOTAL, OBSERVACIÓN. El P.U. se conserva (lo usan las compras ya cotizadas); TOTAL se ignora.
 * Si la selección incluye la columna ITEM (7 columnas), se descarta.
 */
export function parsearPegado(texto: string): FilaPegada[] {
  const lineas = dividirTsv(texto)
  const ancho = Math.max(0, ...lineas.map((l) => l.length))
  const desfase = ancho >= 7 ? 1 : 0

  const esEncabezado = lineas.length > 0 && lineas[0].some((c) => /concepto|caracter[ií]stica|^\s*u\.?\s?d\.?\s?m\.?\s*$/i.test(c))
  const datos = esEncabezado ? lineas.slice(1) : lineas

  return datos.map((celdas) => {
    const unidadOriginal = (celdas[desfase + 1] ?? '').trim()
    return {
      descripcion: unaLinea(celdas[desfase + 2], ' '),
      cantidad: normalizarCantidad(celdas[desfase] ?? ''),
      unidad: unidadOriginal ? normalizarUnidad(unidadOriginal) : 'und',
      unidadOriginal,
      precio: normalizarCantidad(celdas[desfase + 3] ?? ''),
      observacion: unaLinea(celdas[desfase + 5], '; '),
    }
  })
}

export function esPegadoTabular(texto: string) {
  return /[\t\n]/.test(texto.trim())
}
