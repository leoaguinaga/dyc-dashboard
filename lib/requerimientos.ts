import type { Role, TipoRequerimiento } from '@/types/api'

export const TIPO_APPROVERS: Record<TipoRequerimiento, Role[]> = {
  civil:          ['ing_civil', 'ing_electrico', 'jefe_sig', 'gerencia', 'administrador', 'admin_ti'],
  electrico:      ['ing_electrico', 'ing_civil', 'jefe_sig', 'gerencia', 'administrador', 'admin_ti'],
  seguridad:      ['jefe_sig', 'ing_civil', 'ing_electrico', 'gerencia', 'administrador', 'admin_ti'],
  administrativo: ['jefe_sig', 'logistica', 'ing_civil', 'ing_electrico', 'gerencia', 'administrador', 'admin_ti'],
}

export const TIPO_APPROVER_LABEL: Record<TipoRequerimiento, string> = {
  civil:          'Ing. Civil',
  electrico:      'Ing. Eléctrico',
  seguridad:      'Jefe SIG',
  administrativo: 'Logística',
}

const TODOS_LOS_TIPOS: TipoRequerimiento[] = ['civil', 'electrico', 'seguridad', 'administrativo']

// Tipos que cada rol puede crear, tanto en macro requerimientos como en compras
// precotizadas. Debe coincidir con `TIPOS_CREABLES_POR_ROL` del backend
// (src/shared/alcance/tipos-creables.ts), que es quien lo hace cumplir.
const TIPOS_CREABLES_POR_ROL: Partial<Record<Role, TipoRequerimiento[]>> = {
  jefe_sig:             ['seguridad'],
  pdr:                  ['seguridad'],
  ing_electrico:        ['electrico', 'seguridad'],
  supervisor_electrico: ['electrico', 'seguridad'],
  ing_civil:            ['civil', 'electrico'],
  supervisor_civil:     ['civil', 'electrico'],
  supervisor:           TODOS_LOS_TIPOS,
  logistica:            TODOS_LOS_TIPOS,
  gerencia:             TODOS_LOS_TIPOS,
  administrador:        TODOS_LOS_TIPOS,
  admin_ti:             TODOS_LOS_TIPOS,
}

/** Tipos que el rol puede crear; vacío si aún no hay sesión o el rol no crea. */
export function tiposCreablesPorRol(role: Role | null | undefined): TipoRequerimiento[] {
  return (role && TIPOS_CREABLES_POR_ROL[role]) || []
}

/**
 * Tipo efectivo del formulario: el elegido si el rol puede crearlo; si no (o si
 * aún no se eligió, o la sesión recién cargó), el primero que le corresponde.
 * Se deriva en cada render porque la sesión llega después del primer render y
 * un `useState` inicial calculado con el rol vacío se quedaría con un tipo que
 * el rol no puede crear.
 */
export function tipoEfectivo(
  elegido: TipoRequerimiento | null,
  permitidos: TipoRequerimiento[],
): TipoRequerimiento | null {
  return elegido && permitidos.includes(elegido) ? elegido : (permitidos[0] ?? null)
}
