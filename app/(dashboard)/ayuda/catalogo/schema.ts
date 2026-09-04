import type { Role } from '@/types/api'
import type { GuiaProceso } from '../components/guias-data'

/**
 * Contrato para toda guía nueva de la Biblioteca.
 * La guía se documenta una vez; los roles solo controlan su visibilidad.
 */
export type GuiaBiblioteca = GuiaProceso & {
  id: string
  modulo: string
  titulo: string
  subtitulo: string
  objetivo: string
  rolesAplicables: Role[]
  etiquetas: string[]
  requisitosPrevios: string[]
  resultadoEsperado: string
  ultimaRevision: string
  version: string
}

export function definirGuia<const T extends GuiaBiblioteca>(guia: T): T {
  return guia
}
