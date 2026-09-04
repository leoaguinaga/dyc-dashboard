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
