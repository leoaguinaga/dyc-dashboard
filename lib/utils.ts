import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha "de solo día" (guardada como medianoche UTC) sin el
 * corrimiento de un día que produce `new Date(iso).toLocaleDateString()` en
 * zonas horarias detrás de UTC (ej. America/Lima). Lee los componentes en UTC
 * y arma un Date local con esos mismos números antes de formatear.
 */
export function formatDateOnly(
  iso: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
  locale = 'es-PE',
) {
  const d = new Date(iso)
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return local.toLocaleDateString(locale, options)
}
