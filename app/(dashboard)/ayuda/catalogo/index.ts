import type { Role } from '@/types/api'
import {
  GLOSARIO_TERMINOS,
  GUIAS_FAQS,
  GUIAS_PROCESOS,
} from '../components/guias-data'

export { GLOSARIO_TERMINOS, GUIAS_FAQS, GUIAS_PROCESOS }
export type { GuiaFaq, GuiaProceso, GuiaStep } from '../components/guias-data'

const ROLES_CAMPO: Role[] = [
  'supervisor',
  'supervisor_civil',
  'supervisor_electrico',
  'ing_civil',
  'ing_electrico',
]

export function guiaVisibleParaRol(rolesAplicables: Role[], rol?: Role) {
  if (!rol || rol === 'admin_ti') return true
  return rolesAplicables.includes(rol)
}

export function nombreRolBiblioteca(rol?: Role) {
  if (!rol) return 'tu acceso actual'
  if (ROLES_CAMPO.includes(rol)) return 'Supervisión y campo'

  const nombres: Partial<Record<Role, string>> = {
    pdr: 'Prevención y SSOMA',
    logistica: 'Logística y abastecimiento',
    gerencia: 'Gerencia',
    administrador: 'Administración y finanzas',
    jefe_sig: 'SIG y calidad',
    admin_ti: 'Administración del sistema',
  }

  return nombres[rol] ?? 'tu acceso actual'
}

export function textoBusquedaGuia(guia: (typeof GUIAS_PROCESOS)[number]) {
  return [
    guia.titulo,
    guia.subtitulo,
    guia.modulo,
    guia.objetivo,
    ...guia.etiquetas,
    ...guia.pasos.flatMap((paso) => [
      paso.titulo,
      paso.descripcion,
      ...(paso.detalle ?? []),
      paso.tip ?? '',
      paso.advertencia ?? '',
    ]),
  ].join(' ').toLocaleLowerCase('es')
}

export function categoriaFaqParaModulo(modulo: string) {
  const value = modulo.toLocaleLowerCase('es')
  if (value.includes('requerimiento')) return 'requerimientos'
  if (value.includes('cotiz') || value.includes('orden')) return 'cotizaciones'
  if (value.includes('asistencia') || value.includes('tareo')) return 'asistencia'
  if (value.includes('compra simple')) return 'compras'
  if (value.includes('almac')) return 'almacenes'
  if (value.includes('pago') || value.includes('cobro') || value.includes('planilla')) return 'finanzas'
  if (value.includes('proyecto')) return 'proyectos'
  if (value.includes('usuario')) return 'usuarios'
  return 'general'
}
