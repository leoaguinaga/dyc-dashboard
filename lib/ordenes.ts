import type { TipoOrdenCompra } from '@/types/api'

export function ordenBasePath(tipo: TipoOrdenCompra) {
  return tipo === 'servicio' ? '/ordenes-servicio' : '/ordenes-compra'
}

export function ordenLabel(tipo: TipoOrdenCompra) {
  return tipo === 'servicio' ? 'Orden de Servicio' : 'Orden de Compra'
}

export function ordenLabelPlural(tipo: TipoOrdenCompra) {
  return tipo === 'servicio' ? 'Órdenes de servicio' : 'Órdenes de compra'
}

export function ordenPrefijo(tipo: TipoOrdenCompra) {
  return tipo === 'servicio' ? 'OS' : 'OC'
}

const IGV_RATE = 0.18

/**
 * `montoTotal` de una OC es la suma de los ítems (subtotal). Si los precios
 * no incluyen IGV, el total final a pagar lo agrega encima — mismo criterio
 * que el backend (`montoConIgv`) y los PDF/Excel.
 */
export function ocDesglose(oc: { montoTotal: string | number; incluyeIgv?: boolean }) {
  const items = Number(oc.montoTotal) || 0
  const round2 = (n: number) => Math.round(n * 100) / 100
  if (oc.incluyeIgv) {
    const subtotal = round2(items / (1 + IGV_RATE))
    return { subtotal, igv: round2(items - subtotal), total: items }
  }
  const igv = round2(items * IGV_RATE)
  return { subtotal: items, igv, total: round2(items + igv) }
}

export function ocTotalConIgv(oc: { montoTotal: string | number; incluyeIgv?: boolean }) {
  return ocDesglose(oc).total
}
