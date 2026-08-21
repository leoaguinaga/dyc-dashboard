/** Acepta una URL de YouTube (watch, youtu.be, embed) o un ID crudo y devuelve el ID. */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1) || null
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v')
      if (v) return v
      const match = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/)
      if (match) return match[2]
    }
  } catch {
    return null
  }

  return null
}
