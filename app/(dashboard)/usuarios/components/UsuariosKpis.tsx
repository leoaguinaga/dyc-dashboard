import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { User } from '@/types/api'

export async function UsuariosKpis() {
  const result = await serverFetch<User[]>('/users').catch(() => null)
  if (!result) return null

  const admins = result.filter((u) => u.role === 'administrador').length
  const gerencia = result.filter((u) => u.role === 'gerencia').length
  const logistica = result.filter((u) => u.role === 'logistica').length
  const supervisores = result.filter((u) => u.role === 'supervisor').length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <KpiCard
        label="Total usuarios"
        value={result.length}
        context="Cuentas activas en el sistema"
      />
      <KpiCard
        label="TI"
        value={admins}
        context={admins > 0 ? 'Acceso completo' : undefined}
      />
      <KpiCard
        label="Gerencia / Logística"
        value={gerencia + logistica}
        context={`${gerencia} gerencia · ${logistica} logística`}
      />
      <KpiCard
        label="Supervisores"
        value={supervisores}
        context={result.length > 0 ? `${Math.round((supervisores / result.length) * 100)}% del total` : undefined}
      />
    </div>
  )
}
