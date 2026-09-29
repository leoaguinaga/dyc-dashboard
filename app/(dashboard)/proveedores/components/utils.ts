import type { Proveedor } from '@/types/api'

const SUFIJOS = /\b(s\.?a\.?c\.?|s\.?r\.?l\.?(tda)?\.?|s\.?c\.?r\.?l\.?|e\.?i\.?r\.?l\.?|s\.?a\.?)\b/g

export function normalizarNombre(razonSocial: string) {
  return razonSocial
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(SUFIJOS, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** IDs de proveedores cuyo nombre normalizado coincide con el de otro registro. */
export function detectarDuplicados(proveedores: Proveedor[]) {
  const grupos = new Map<string, string[]>()
  for (const p of proveedores) {
    const k = normalizarNombre(p.razonSocial)
    grupos.set(k, [...(grupos.get(k) ?? []), p.id])
  }
  const ids = new Set<string>()
  for (const g of grupos.values()) if (g.length > 1) g.forEach((id) => ids.add(id))
  return ids
}

export function sinContacto(p: Proveedor) {
  return !p.contactos || p.contactos.length === 0
}

export function datosIncompletos(p: Proveedor) {
  return sinContacto(p) || !p.categoria
}

export function formatSoles(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)} M`
  if (n >= 10_000) return `S/ ${Math.round(n / 1000)} k`
  return `S/ ${Math.round(n).toLocaleString('es-PE')}`
}

export function haceCuanto(iso: string | null | undefined) {
  if (!iso) return 'Sin actividad'
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'Hoy'
  if (dias < 14) return `Hace ${dias} d`
  if (dias < 60) return `Hace ${Math.round(dias / 7)} sem.`
  return `Hace ${Math.round(dias / 30)} meses`
}
