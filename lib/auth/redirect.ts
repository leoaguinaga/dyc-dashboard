export const DEFAULT_REDIRECT = '/dashboard'

// Pantallas públicas: volver a ellas tras iniciar sesión dejaría al usuario en el login.
const PUBLIC_PATHS = /^\/(login|reset-password)(\/|$)/

/**
 * Devuelve `value` solo si es una ruta interna del dashboard; cualquier otra cosa
 * (URL absoluta, `//otro-sitio`, `/\otro-sitio`, rutas públicas) cae al panel. Evita
 * que `?redirect=` sirva de open redirect.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = DEFAULT_REDIRECT) {
  if (!value) return fallback
  try {
    const base = 'http://internal.invalid'
    const url = new URL(value, base)
    if (url.origin !== base || PUBLIC_PATHS.test(url.pathname)) return fallback
    return url.pathname + url.search
  } catch {
    return fallback
  }
}

/** URL del login que devuelve al usuario a `requested` una vez autenticado. */
export function loginUrl(requested?: string | null) {
  const target = safeRedirectPath(requested)
  return target === DEFAULT_REDIRECT ? '/login' : `/login?redirect=${encodeURIComponent(target)}`
}
