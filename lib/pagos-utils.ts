import type { Pago } from '@/types/api'

export function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtFechaCorta(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function normalizarBanco(banco?: string | null): string {
  if (!banco) return 'Sin banco'
  const b = banco.toUpperCase()
  if (b.includes('BCP') || b.includes('CREDITO')) return 'BCP'
  if (b.includes('BBVA') || b.includes('CONTINENTAL')) return 'BBVA'
  if (b.includes('INTERBANK')) return 'Interbank'
  if (b.includes('SCOTIABANK')) return 'Scotiabank'
  if (b.includes('NACION')) return 'Banco de la Nación'
  if (b.includes('BANBIF')) return 'BanBif'
  return banco.trim()
}

export interface InfoDestinoPago {
  esBilletera: boolean
  billetera?: 'yape' | 'plin'
  metodoLabel: string
  banco?: string | null
  bancoNorm: string
  numero?: string | null
  numeroLabel: 'Cel' | 'Cta' | 'CCI'
  cci?: string | null
}

export function getDestinoPago(p: Pago): InfoDestinoPago {
  const oc = p.ordenCompra
  const metodoOc = oc?.pagoMetodo
  const esTrabajador = p.tipoBeneficiario === 'trabajador' || oc?.destinoPago === 'trabajador'

  // 1. Caso Yape en Compra Simple
  if (metodoOc === 'yape') {
    const cel = oc?.pagoTrabajadorNumero || p.beneficiarioTrabajador?.telefono || null
    return {
      esBilletera: true,
      billetera: 'yape',
      metodoLabel: 'Yape',
      bancoNorm: 'Yape',
      numero: cel,
      numeroLabel: 'Cel',
    }
  }

  // 2. Caso Plin en Compra Simple
  if (metodoOc === 'plin') {
    const cel = oc?.pagoTrabajadorNumero || p.beneficiarioTrabajador?.telefono || null
    return {
      esBilletera: true,
      billetera: 'plin',
      metodoLabel: 'Plin',
      bancoNorm: 'Plin',
      numero: cel,
      numeroLabel: 'Cel',
    }
  }

  // 3. Caso Transferencia específica a trabajador en Compra Simple
  if (metodoOc === 'transferencia') {
    const b = oc?.pagoTrabajadorBanco || p.banco || p.beneficiarioTrabajador?.banco || null
    const c = oc?.pagoTrabajadorNumeroCuenta || p.numeroCuenta || p.beneficiarioTrabajador?.numeroCuenta || null
    return {
      esBilletera: false,
      metodoLabel: 'Transferencia',
      banco: b,
      bancoNorm: normalizarBanco(b),
      numero: c,
      numeroLabel: 'Cta',
      cci: p.cci || null,
    }
  }

  // 4. Caso Cuenta Registrada en perfil de trabajador o trabajador sin método explícito
  if (metodoOc === 'registrado' || esTrabajador) {
    const b =
      oc?.pagoTrabajador?.banco ||
      p.beneficiarioTrabajador?.banco ||
      p.banco ||
      oc?.pagoBanco ||
      null
    const c =
      oc?.pagoTrabajador?.numeroCuenta ||
      p.beneficiarioTrabajador?.numeroCuenta ||
      p.numeroCuenta ||
      oc?.pagoNumeroCuenta ||
      null
    const tel = oc?.pagoTrabajador?.telefono || p.beneficiarioTrabajador?.telefono || null

    if (b || c) {
      return {
        esBilletera: false,
        metodoLabel: 'Cuenta registrada',
        banco: b,
        bancoNorm: normalizarBanco(b),
        numero: c,
        numeroLabel: 'Cta',
        cci: p.cci || null,
      }
    }

    if (tel) {
      return {
        esBilletera: false,
        metodoLabel: 'Celular',
        bancoNorm: 'Sin banco',
        numero: tel,
        numeroLabel: 'Cel',
      }
    }
  }

  // 5. Caso General / Proveedor
  const b = p.banco || oc?.pagoBanco || oc?.proveedor?.banco || null
  const c = p.numeroCuenta || oc?.pagoNumeroCuenta || oc?.proveedor?.numeroCuenta || null
  const cci = p.cci || null

  return {
    esBilletera: false,
    metodoLabel: 'Transferencia',
    banco: b,
    bancoNorm: normalizarBanco(b),
    numero: c,
    numeroLabel: 'Cta',
    cci,
  }
}

export function getBeneficiario(p: Pago) {
  return p.tipoBeneficiario === 'trabajador'
    ? (p.beneficiarioTrabajador?.nombre ?? p.beneficiarioNombre ?? 'Trabajador')
    : (p.beneficiarioNombre ??
      p.ordenCompra?.proveedor?.razonSocial ??
      p.ordenCompra?.proveedorNombreLibre ??
      'Sin beneficiario')
}

export function getConcepto(p: Pago) {
  const beneficiario = getBeneficiario(p)
  return (
    p.ordenCompra?.nombre ??
    p.ordenCompra?.concepto ??
    (p.concepto && p.concepto !== beneficiario ? p.concepto : null) ??
    'Sin concepto'
  )
}

export function getUrgencia(fechaProgramada: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const target = new Date(`${fechaProgramada.slice(0, 10)}T00:00:00`)
  const diffTime = target.getTime() - hoy.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const d = Math.abs(diffDays)
    return {
      tipo: 'vencido' as const,
      dias: d,
      label: d === 1 ? 'Vencido ayer' : `Vencido hace ${d}d`,
      shortBadge: `-${d}d`,
      badgeClass: 'bg-destructive/10 text-destructive border-destructive/20 font-medium',
    }
  }
  if (diffDays === 0) {
    return {
      tipo: 'hoy' as const,
      dias: 0,
      label: 'Vence hoy',
      shortBadge: 'Hoy',
      badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30 font-semibold',
    }
  }
  if (diffDays === 1) {
    return {
      tipo: 'manana' as const,
      dias: 1,
      label: 'Vence mañana',
      shortBadge: 'Mañana',
      badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-500/20 font-medium',
    }
  }
  if (diffDays <= 7) {
    return {
      tipo: 'semana' as const,
      dias: diffDays,
      label: `En ${diffDays} días`,
      shortBadge: `${diffDays}d`,
      badgeClass: 'bg-muted text-foreground border-border',
    }
  }
  return {
    tipo: 'futuro' as const,
    dias: diffDays,
    label: `En ${diffDays} días`,
    shortBadge: `${diffDays}d`,
    badgeClass: 'bg-muted/50 text-muted-foreground border-border/40',
  }
}

/** Nombre del trabajador beneficiario cuando el pago va a una persona del sistema. */
function trabajadorBeneficiario(pago: Pago): string | null {
  return pago.tipoBeneficiario === 'trabajador' && pago.beneficiarioTrabajadorId
    ? (pago.beneficiarioTrabajador?.nombre ?? null)
    : null
}

/** Quien sustenta el gasto por defecto: lo ya registrado o, si el pago va a un trabajador, ese trabajador. */
export function responsableRendicionInicial(pago: Pago | null): string {
  if (!pago) return ''
  return pago.responsableRendicionNombre ?? trabajadorBeneficiario(pago) ?? ''
}

/**
 * Parte del cuerpo de `marcar-pagado` con la cuenta de origen y el responsable
 * de la rendición. Si el responsable es el trabajador beneficiario se vincula a él;
 * si no, queda solo el nombre escrito.
 */
export function datosOrigenYRendicion(pago: Pago, cuentaOrigenId: string, responsable: string) {
  const nombre = responsable.trim()
  const trabajador = trabajadorBeneficiario(pago)
  return {
    cuentaOrigenId: cuentaOrigenId || undefined,
    ...(trabajador && nombre === trabajador
      ? { responsableRendicionId: pago.beneficiarioTrabajadorId ?? undefined }
      : nombre
        ? { responsableRendicionNombre: nombre }
        : {}),
  }
}

const EMPRESA_DYC = {
  razonSocial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC',
  ruc: '20608745611',
  direccion: 'Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque',
}

/** Empresa que emite la constancia: la del pago; sin ella, D&C. La dirección solo se conoce para D&C. */
export function empresaDeConstancia(pago: Pago) {
  if (!pago.empresa) return EMPRESA_DYC
  return {
    razonSocial: pago.empresa.razonSocial,
    ruc: pago.empresa.ruc,
    direccion: pago.empresa.ruc === EMPRESA_DYC.ruc ? EMPRESA_DYC.direccion : null,
  }
}

/** N° que identifica la constancia: AA-NNNN (con la línea si el comprobante se reparte: 26-2248.2). */
export function referenciaConstancia(pago: Pago): string {
  if (pago.codigoComprobante) {
    const linea = pago.subNumero && pago.subNumero > 1 ? `.${pago.subNumero}` : ''
    return `${pago.codigoComprobante}${linea}`
  }
  return pago.numeroOperacion || pago.id.slice(-8).toUpperCase()
}

/** Responsable de la rendición; para pagos anteriores a registrarlo, quien ejecutó el pago. */
export function responsableRendicionConstancia(pago: Pago): string {
  return (
    pago.responsableRendicionNombre ??
    pago.responsableRendicion?.nombre ??
    pago.pagadoPor?.name ??
    'No registrado'
  )
}

/** Cuenta de la empresa de la que salió el dinero, para la constancia. */
export function cuentaOrigenConstancia(pago: Pago): string {
  return pago.cuentaOrigen ? `${pago.cuentaOrigen.banco} · ${pago.cuentaOrigen.numero}` : 'No registrado'
}

/**
 * "Responsable" del registro en la constancia. En pagos importados, `registradoPor`
 * es quien ejecutó la carga, no quien gestionó el pago: se usa quien generó el comprobante.
 */
export function responsableRegistroConstancia(pago: Pago): string {
  if (pago.origen === 'importado') return pago.pagadoPor?.name ?? pago.generadoPorNombre ?? 'No registrado'
  return pago.registradoPor.name
}
