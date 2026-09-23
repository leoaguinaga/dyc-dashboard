import type { Role } from '@/types/api'

export const ROLE_LABELS: Record<Role, string> = {
  administrador: 'Administrador',
  admin_ti: 'Admin TI',
  gerencia: 'Gerencia',
  logistica: 'Logística',
  supervisor: 'Supervisor',
  supervisor_civil: 'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr: 'PDR (Seguridad)',
  ing_civil: 'Ing. Civil',
  ing_electrico: 'Ing. Eléctrico',
  jefe_sig: 'Jefe SIG',
}

export const ROLE_COLORS: Record<Role, string> = {
  administrador: 'bg-primary/10 text-primary',
  admin_ti: 'bg-violet-500/10 text-violet-600',
  gerencia: 'bg-chart-1/15 text-chart-1',
  logistica: 'bg-chart-2/15 text-chart-2',
  supervisor: 'bg-muted text-muted-foreground',
  supervisor_civil: 'bg-blue-500/10 text-blue-600',
  supervisor_electrico: 'bg-amber-500/10 text-amber-600',
  pdr: 'bg-orange-500/10 text-orange-600',
  ing_civil: 'bg-blue-500/10 text-blue-600',
  ing_electrico: 'bg-amber-500/10 text-amber-600',
  jefe_sig: 'bg-orange-500/10 text-orange-600',
}
