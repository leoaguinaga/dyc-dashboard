const UNIDADES = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
]

const DECENAS = [
  '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
]

const VEINTIDOS = [
  'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO',
  'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
]

const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
]

function convertirGrupo(num: number): string {
  if (num === 0) return ''
  if (num < 20) return UNIDADES[num]

  if (num < 100) {
    const decena = Math.floor(num / 10)
    const unidad = num % 10
    if (decena === 2) return VEINTIDOS[unidad]
    return unidad === 0 ? DECENAS[decena] : `${DECENAS[decena]} Y ${UNIDADES[unidad]}`
  }

  if (num === 100) return 'CIEN'

  const centena = Math.floor(num / 100)
  const resto = num % 100
  const prefijo = CENTENAS[centena]
  return resto === 0 ? prefijo : `${prefijo} ${convertirGrupo(resto)}`
}

function convertirEntero(num: number): string {
  if (num === 0) return 'CERO'

  if (num < 1000) return convertirGrupo(num)

  if (num < 1_000_000) {
    const miles = Math.floor(num / 1000)
    const resto = num % 1000
    const prefijoMiles = miles === 1 ? 'MIL' : `${convertirGrupo(miles)} MIL`
    return resto === 0 ? prefijoMiles : `${prefijoMiles} ${convertirGrupo(resto)}`
  }

  if (num < 1_000_000_000) {
    const millones = Math.floor(num / 1_000_000)
    const resto = num % 1_000_000
    const prefijoMillones = millones === 1 ? 'UN MILLÓN' : `${convertirGrupo(millones)} MILLONES`
    return resto === 0 ? prefijoMillones : `${prefijoMillones} ${convertirEntero(resto)}`
  }

  return String(num)
}

const NOMBRE_MONEDA: Record<string, string> = {
  SOLES: 'SOLES',
  PEN: 'SOLES',
  DOLARES: 'DÓLARES',
  USD: 'DÓLARES',
}

export function numeroALetras(monto: number, moneda?: string | null): string {
  const entero = Math.floor(Math.abs(monto))
  const decimales = Math.round((Math.abs(monto) - entero) * 100)
  const nombreMoneda = NOMBRE_MONEDA[(moneda ?? 'SOLES').toUpperCase()] ?? 'SOLES'

  return `${convertirEntero(entero)} Y ${String(decimales).padStart(2, '0')}/100 ${nombreMoneda}`
}
