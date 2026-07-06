export const CATEGORIAS_PROVEEDOR = [
  'Materiales eléctricos',
  'Materiales civiles',
  'Herramientas y equipos',
  'Seguridad y EPP',
  'Transporte y logística',
  'Servicios especializados',
  'Administrativo y oficina',
  'Otro',
] as const

export type CategoriaProveedor = (typeof CATEGORIAS_PROVEEDOR)[number]
