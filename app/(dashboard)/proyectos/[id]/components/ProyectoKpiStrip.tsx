import { KpiCard } from '@/components/shared/KpiCard'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { Proyecto, OrdenCompra, Pago } from '@/types/api'

interface Props {
  proyecto: Proyecto
  ordenes: OrdenCompra[]
  pagos: Pago[]
}

export function ProyectoKpiStrip({ proyecto, ordenes, pagos }: Props) {
  // Hitos
  const hitos = proyecto.hitos ?? []
  const totalHitos = hitos.length
  const hitosCumplidos = hitos.filter((h) => h.cumplimiento === 'si').length
  const hitosNoCumplidos = hitos.filter((h) => h.cumplimiento === 'no').length
  const pctHitos = totalHitos > 0 ? (hitosCumplidos / totalHitos) * 100 : 0

  // Personal
  const trabajadores = proyecto.trabajadores ?? []
  const operariosActivos = trabajadores.filter((t) => !t.fechaSalida).length
  const supervisoresCount = (proyecto.supervisores ?? []).length

  // Compras
  const ordenesValidas = ordenes.filter((o) => o.estado !== 'cancelada')
  const montoCompras = ordenesValidas.reduce((acc, o) => acc + Number(o.montoTotal || 0), 0)

  // Pagos
  const pagosPendientes = pagos.filter(
    (p) => p.estadoEfectivo === 'pendiente' || p.estadoEfectivo === 'vencido',
  )
  const montoPagos = pagosPendientes.reduce((acc, p) => acc + Number(p.monto || 0), 0)
  const pagosVencidos = pagos.filter((p) => p.estadoEfectivo === 'vencido').length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Avance de hitos"
        value={totalHitos > 0 ? formatPercent(pctHitos) : '0%'}
        context={
          totalHitos > 0
            ? `${hitosCumplidos} de ${totalHitos} completados`
            : 'Sin hitos programados'
        }
        delta={
          hitosNoCumplidos > 0
            ? { label: `${hitosNoCumplidos} no cumplido(s)`, trend: 'down' }
            : totalHitos > 0 && hitosCumplidos === totalHitos
              ? { label: '100% al día', trend: 'up' }
              : undefined
        }
      />

      <KpiCard
        label="Personal asignado"
        value={operariosActivos}
        context={`${supervisoresCount} supervisor(es) asignado(s)`}
        delta={
          trabajadores.length > 0
            ? { label: `${trabajadores.length} en historial`, trend: 'neutral' }
            : undefined
        }
      />

      <KpiCard
        label="Compras y servicios"
        value={formatCurrency(montoCompras)}
        context={`${ordenesValidas.length} orden(es) activas`}
        delta={
          ordenes.some((o) => o.estado === 'recibida_parcial')
            ? { label: 'Recep. parcial', trend: 'neutral' }
            : ordenesValidas.length > 0
              ? { label: 'Al día', trend: 'neutral' }
              : undefined
        }
      />

      <KpiCard
        label="Pagos pendientes"
        value={formatCurrency(montoPagos)}
        context={`${pagosPendientes.length} pago(s) programados`}
        delta={
          pagosVencidos > 0
            ? { label: `${pagosVencidos} vencido(s)`, trend: 'down' }
            : pagosPendientes.length > 0
              ? { label: 'Al día', trend: 'neutral' }
              : { label: 'Sin deuda', trend: 'up' }
        }
      />
    </div>
  )
}
