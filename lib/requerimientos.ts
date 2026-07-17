import type { Role, TipoRequerimiento } from '@/types/api'

export const TIPO_APPROVERS: Record<TipoRequerimiento, Role[]> = {
  civil:          ['ing_civil', 'gerencia', 'administrador'],
  electrico:      ['ing_electrico', 'gerencia', 'administrador'],
  seguridad:      ['jefe_sig', 'gerencia', 'administrador'],
  administrativo: ['logistica', 'gerencia', 'administrador'],
}

export const TIPO_APPROVER_LABEL: Record<TipoRequerimiento, string> = {
  civil:          'Ing. Civil',
  electrico:      'Ing. Eléctrico',
  seguridad:      'Jefe SIG',
  administrativo: 'Logística',
}
