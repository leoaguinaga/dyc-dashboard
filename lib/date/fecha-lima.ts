const TIMEZONE = 'America/Lima';

/**
 * "Hoy" calendario en hora de Lima (YYYY-MM-DD). `toISOString().slice(0, 10)`
 * calcula el día en UTC — entre ~19:00 y medianoche hora Lima (UTC-5) eso ya
 * cuenta como el día siguiente, y deja de coincidir con lo que devuelve el
 * backend (ver backend/src/shared/date/fecha.util.ts).
 */
export function hoyLimaISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}
