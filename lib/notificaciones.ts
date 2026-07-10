import type { Notificacion } from '@/types/api'

export function entidadHref(n: Notificacion): string | null {
  if (!n.entidadId) return null
  switch (n.entidadTipo) {
    case 'Requerimiento':
      return `/requerimientos/${n.entidadId}`
    case 'SolicitudCotizacion':
      return `/cotizaciones/${n.entidadId}`
    case 'OrdenCompra':
      return `/ordenes-compra/${n.entidadId}`
    case 'Pago':
      return '/pagos'
    default:
      return null
  }
}
