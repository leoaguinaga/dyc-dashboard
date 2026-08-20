import type { Role, TipoRequerimiento } from '@/types/api'

export const TIPO_APPROVERS: Record<TipoRequerimiento, Role[]> = {
  civil:          ['ing_civil', 'ing_electrico', 'gerencia', 'administrador', 'admin_ti'],
  electrico:      ['ing_electrico', 'ing_civil', 'gerencia', 'administrador', 'admin_ti'],
  seguridad:      ['jefe_sig', 'ing_civil', 'ing_electrico', 'gerencia', 'administrador', 'admin_ti'],
  administrativo: ['logistica', 'ing_civil', 'ing_electrico', 'gerencia', 'administrador', 'admin_ti'],
}

export const TIPO_APPROVER_LABEL: Record<TipoRequerimiento, string> = {
  civil:          'Ing. Civil',
  electrico:      'Ing. Eléctrico',
  seguridad:      'Jefe SIG',
  administrativo: 'Logística',
}
