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
