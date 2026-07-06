import type { UnidadMedida } from '@/types/api'

export const UNIDAD_LABELS: Record<UnidadMedida, string> = {
  und: 'Unidad',
  kg: 'Kilogramo',
  m: 'Metro',
  m2: 'Metro²',
  m3: 'Metro³',
  l: 'Litro',
  gal: 'Galón',
  bolsa: 'Bolsa',
  caja: 'Caja',
  rollo: 'Rollo',
  par: 'Par',
  juego: 'Juego',
}

export const UNIDAD_ABBR: Record<UnidadMedida, string> = {
  und: 'und',
  kg: 'kg',
  m: 'm',
  m2: 'm²',
  m3: 'm³',
  l: 'L',
  gal: 'gal',
  bolsa: 'bolsa',
  caja: 'caja',
  rollo: 'rollo',
  par: 'par',
  juego: 'juego',
}

export const UNIDAD_OPTIONS = Object.entries(UNIDAD_LABELS) as [
  UnidadMedida,
  string,
][]

