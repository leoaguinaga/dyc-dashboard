import type { CategoriaObrero } from '@/types/api'

export const OBRERO_CARGOS = ['Operario', 'Técnico']

export const CATEGORIAS_OBRERO: { value: CategoriaObrero; label: string }[] = [
  { value: 'operario', label: 'Operario' },
  { value: 'oficial', label: 'Oficial' },
  { value: 'peon', label: 'Peón' },
]

export type PerfilObreroState = {
  categoria: CategoriaObrero | ''
  precioHora: string
  tipoSangre: string
  contactoEmergenciaNombre: string
  contactoEmergenciaTelefono: string
  direccion: string
  tallaUniforme: string
  tallaCalzado: string
  numeroSctr: string
}

export const perfilObreroInitial: PerfilObreroState = {
  categoria: '',
  precioHora: '',
  tipoSangre: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
  direccion: '',
  tallaUniforme: '',
  tallaCalzado: '',
  numeroSctr: '',
}

export function perfilObreroToPayload(value: PerfilObreroState): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (value.categoria) payload.categoria = value.categoria
  if (value.precioHora) payload.precioHora = Number(value.precioHora)
  if (value.tipoSangre.trim()) payload.tipoSangre = value.tipoSangre.trim()
  if (value.contactoEmergenciaNombre.trim()) payload.contactoEmergenciaNombre = value.contactoEmergenciaNombre.trim()
  if (value.contactoEmergenciaTelefono.trim()) payload.contactoEmergenciaTelefono = value.contactoEmergenciaTelefono.trim()
  if (value.direccion.trim()) payload.direccion = value.direccion.trim()
  if (value.tallaUniforme.trim()) payload.tallaUniforme = value.tallaUniforme.trim()
  if (value.tallaCalzado.trim()) payload.tallaCalzado = value.tallaCalzado.trim()
  if (value.numeroSctr.trim()) payload.numeroSctr = value.numeroSctr.trim()
  return payload
}
