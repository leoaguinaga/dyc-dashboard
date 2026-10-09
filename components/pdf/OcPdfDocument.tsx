import fs from 'fs'
import path from 'path'
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import type { OrdenCompra, TipoRequerimiento } from '@/types/api'
import { numeroALetras } from '@/lib/numero-a-letras'

const FIRMA_JEFE_ADMIN = fs.readFileSync(
  path.join(process.cwd(), 'public', 'signatures', 'jefe-admin.jpg'),
)
const FIRMA_LOGISTICA = fs.readFileSync(
  path.join(process.cwd(), 'public', 'signatures', 'logistica.jpg'),
)

// Use built-in font families (Helvetica ships with @react-pdf/renderer)
Font.register({
  family: 'Helvetica',
  fonts: [],
})
// Avoid react-pdf's automatic word hyphenation (e.g. "Chi-clayo")
Font.registerHyphenationCallback((word) => [word])

const EMPRESA = {
  razonSocial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC',
  nombreComercial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC',
  ruc: '20608745611',
  direccion: 'Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque',
  tagline: 'Ejecutando obras con estándares de salud, seguridad, calidad y protección medio ambiente',
}

const C = {
  navy: '#1a3557',
  blue: '#2563a8',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#d1d5db',
  text: '#111827',
  muted: '#6b7280',
  white: '#ffffff',
  green: '#166534',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 28,
    paddingBottom: 38,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  // ── Barra de continuación (solo páginas 2+) ─────────────────────────────
  contBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: C.navy,
    paddingBottom: 5,
    marginBottom: 8,
  },
  contBarText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy },
  contBarMuted: { fontSize: 8, color: C.muted },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  companyBlock: { gap: 2, maxWidth: 300 },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 0.2 },
  companyTagline: { fontSize: 7, color: C.muted, marginTop: 2 },
  docBlock: { alignItems: 'flex-end', gap: 2 },
  docLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.blue, letterSpacing: 0.5, textAlign: 'right' },
  docSubLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.muted, letterSpacing: 0.4, textAlign: 'right' },
  docNumero: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.navy },
  docNombre: { fontSize: 8.5, color: C.text, textAlign: 'right' },
  docFecha: { fontSize: 8, color: C.muted },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: { borderBottomWidth: 2, borderBottomColor: C.navy, marginBottom: 6 },
  dividerThin: { borderBottomWidth: 0.5, borderBottomColor: C.border, marginVertical: 3 },

  // ── Info row ─────────────────────────────────────────────────────────────
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  infoBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 2.5,
  },
  infoBoxTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.blue, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  infoLine: { flexDirection: 'row', gap: 4 },
  infoLabel: { fontSize: 8, color: C.muted, width: 72 },
  infoValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: C.lightGray },
  thText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.3 },
  tdText: { fontSize: 8 },
  colCod: { width: 46 },
  colCant: { width: 42, textAlign: 'right' },
  colUnid: { width: 40, textAlign: 'center' },
  colDesc: { flex: 1, paddingHorizontal: 4 },
  colPUnit: { width: 66, textAlign: 'right' },
  colTotal: { width: 70, textAlign: 'right' },

  // ── Cierre: lo que debe permanecer junto con las firmas ─────────────────
  closing: { flexGrow: 1 },
  closingBlock: { marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  summaryLeft: { flex: 1, gap: 6 },
  paymentBoxStack: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  summaryRight: { width: 180, gap: 3 },

  // ── Monto en letras ──────────────────────────────────────────────────────
  sonText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy },

  // ── Forma de pago / contactos ────────────────────────────────────────────
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 2.5,
  },
  paymentTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.blue, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  paymentTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  paymentCondicion: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },
  paymentLine: { flexDirection: 'row', gap: 4 },
  paymentLabel: { fontSize: 8, color: C.muted, width: 72 },
  paymentValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },

  // ── Forma de pago (tabla de tramos) ─────────────────────────────────────
  formaPagoTableHeader: {
    flexDirection: 'row',
    backgroundColor: C.lightGray,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  formaPagoRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  fpThText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase' },
  fpTdText: { fontSize: 8 },
  fpColConcepto: { flex: 1.3 },
  fpColPct: { width: 28, textAlign: 'right' },
  fpColBruto: { width: 58, textAlign: 'right' },
  fpColDetraccion: { width: 54, textAlign: 'right' },
  fpColNeto: { width: 58, textAlign: 'right' },

  // ── Totals ─────────────────────────────────────────────────────────────────
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  totalLabel: { fontSize: 8, color: C.muted },
  totalValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.navy,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  grandTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.white },
  netoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 3,
    paddingHorizontal: 8,
  },

  // ── Notes ──────────────────────────────────────────────────────────────────
  notesBlock: { paddingVertical: 5, paddingHorizontal: 8, borderWidth: 0.5, borderColor: C.border, borderRadius: 4, gap: 2 },
  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  notesText: { fontSize: 8, color: C.text },

  // ── Reserva de derecho ──────────────────────────────────────────────────
  reserveText: { fontSize: 7, color: C.muted, lineHeight: 1.35 },

  // ── Firmas: Administración y Logística juntas a la izquierda, Recibe a la derecha
  signatureRow: { flexDirection: 'row', gap: 20, marginTop: 'auto', paddingTop: 8 },
  signatureCol: { flex: 1, alignItems: 'center' },
  signatureImage: { width: 120, height: 40, objectFit: 'contain' },
  signatureSpace: { width: 120, height: 40 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: C.text, alignSelf: 'stretch', marginTop: 2, marginBottom: 3 },
  signatureTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'center' },

  // ── Footer (fijo en todas las páginas) ───────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: C.muted },
})

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Administrativo',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Los valores en base de datos conservan su precisión original. El PDF muestra
// importes monetarios a 2 decimales, excepto el precio unitario a 4.
function fmtMoney(n: string | number, fractionDigits = 2) {
  return `S/ ${parseFloat(String(n)).toLocaleString('es-PE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

function fmtPercent(n: string | number) {
  return `${Number(n).toLocaleString('es-PE', { maximumFractionDigits: 1 })}%`
}

/** Redondea a 2 decimales antes de usar el valor en el siguiente paso del
 * cálculo, para que las cifras impresas siempre sumen/cuadren exactamente
 * entre sí (evita arrastrar el error de coma flotante de un paso al otro). */
function round2(n: number) {
  return Math.round(n * 100) / 100
}

interface Props {
  oc: OrdenCompra
}

export function OcPdfDocument({ oc }: Props) {
  const itemsTotal = oc.items.reduce((sum, i) => sum + parseFloat(i.precioTotal), 0)
  // Si la respuesta del proveedor ya incluye IGV, los precios de línea son el total
  // (hay que descontar el IGV para mostrar el V. Compra sin IGV); si no, se agrega 18%.
  const subtotal = round2(oc.incluyeIgv ? itemsTotal / 1.18 : itemsTotal)
  const igv = round2(oc.incluyeIgv ? itemsTotal - subtotal : itemsTotal * 0.18)
  const total = round2(oc.incluyeIgv ? itemsTotal : subtotal + igv)

  const detraccionRaw = oc.detraccionPorcentaje ? parseFloat(oc.detraccionPorcentaje) : null
  const retencionRaw = oc.retencionPorcentaje ? parseFloat(oc.retencionPorcentaje) : null
  const tieneFiscal = Boolean(detraccionRaw || retencionRaw)
  const fiscalLabel = retencionRaw != null && detraccionRaw == null ? 'Retención' : 'Detracción'
  const fiscalPct = detraccionRaw ?? retencionRaw ?? 0

  const pagosActivos = (oc.pagos ?? []).filter((p) => p.estado !== 'cancelado')
  const filasPago =
    pagosActivos.length > 0
      ? pagosActivos.map((p, index) => {
          const bruto = round2(parseFloat(p.monto))
          const detraccion = tieneFiscal ? round2((bruto * fiscalPct) / 100) : 0
          return {
            concepto: p.nota?.trim() || `Cuota ${index + 1} (${fmtDate(p.fechaProgramada)})`,
            porcentaje: parseFloat(p.porcentaje),
            bruto,
            detraccion,
            neto: round2(bruto - detraccion),
          }
        })
      : (() => {
          const detraccion = tieneFiscal ? round2((total * fiscalPct) / 100) : 0
          return [{ concepto: 'Pago único', porcentaje: 100, bruto: total, detraccion, neto: round2(total - detraccion) }]
        })()

  const descuentoMonto = oc.descuentoMonto ? round2(parseFloat(oc.descuentoMonto)) : 0
  const sumaNetos = round2(filasPago.reduce((s, f) => s + f.neto, 0))
  const totalNetoAPagar = round2(sumaNetos - descuentoMonto)

  const requerimiento = oc.solicitud?.requerimiento
  // El PDF solo se exporta para OCs del flujo macro, donde el proveedor siempre está presente.
  const proveedor = oc.proveedor!
  const contactoProveedor = proveedor.contactos?.[0]

  const docLabel = oc.tipo === 'servicio' ? 'Orden de Servicio' : 'Orden de Compra'

  const mostrarNeto = tieneFiscal || descuentoMonto > 0
  const tipoCambio = oc.tipoCambio ? Number(oc.tipoCambio) : 0

  const colHeader = (
    <View style={s.tableHeader}>
      <Text style={[s.thText, s.colCod]}>Cod.</Text>
      <Text style={[s.thText, s.colCant]}>Cant.</Text>
      <Text style={[s.thText, s.colUnid]}>U.D.M</Text>
      <Text style={[s.thText, s.colDesc]}>Descripción</Text>
      <Text style={[s.thText, s.colPUnit]}>P. Unitario</Text>
      <Text style={[s.thText, s.colTotal]}>P. Total</Text>
    </View>
  )

  const FILAS_CON_EL_CIERRE = 3
  const itemsCuerpo = oc.items.slice(0, Math.max(0, oc.items.length - FILAS_CON_EL_CIERRE))
  const itemsCola = oc.items.slice(itemsCuerpo.length)

  const renderFila = (item: (typeof oc.items)[number], idx: number) => (
    <View key={item.id} wrap={false} style={[s.tableRow, idx % 2 !== 0 ? s.tableRowAlt : {}]}>
      <Text style={[s.tdText, s.colCod]}>{item.codigo ?? String(idx + 1)}</Text>
      <Text style={[s.tdText, s.colCant]}>{parseFloat(item.cantidad).toLocaleString('es-PE')}</Text>
      <Text style={[s.tdText, s.colUnid]}>{item.unidad}</Text>
      <Text style={[s.tdText, s.colDesc]}>{item.descripcion}</Text>
      <Text style={[s.tdText, s.colPUnit]}>{fmtMoney(item.precioUnitario, 4)}</Text>
      <Text style={[s.tdText, s.colTotal]}>{fmtMoney(item.precioTotal)}</Text>
    </View>
  )

  return (
    <Document
      title={`${oc.numero} - ${docLabel}`}
      author="D&C Ingeniería y Proyectos"
    >
      <Page size="A4" style={s.page}>

        {/* ── Continuación: barra + cabecera de columnas en las páginas 2+ ───── */}
        <View
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <View>
                <View style={s.contBar}>
                  <Text style={s.contBarText}>
                    {docLabel.toUpperCase()} N° {oc.numero} · {proveedor.razonSocial}
                  </Text>
                  <Text style={s.contBarMuted}>Continuación</Text>
                </View>
                {colHeader}
              </View>
            ) : null
          }
        />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.companyBlock}>
            <Text style={s.companyName}>{EMPRESA.nombreComercial}</Text>
            <Text style={s.companyTagline}>{EMPRESA.tagline}</Text>
          </View>
          <View style={s.docBlock}>
            <Text style={s.docLabel}>{docLabel.toUpperCase()}</Text>
            <Text style={s.docSubLabel}>GUÍA DE INTERNAMIENTO</Text>
            <Text style={s.docNumero}>N° {oc.numero}</Text>
            {oc.nombre && <Text style={s.docNombre}>{oc.nombre}</Text>}
            <Text style={s.docFecha}>
              {oc.fechaEmision ? `Emitida: ${fmtDate(oc.fechaEmision)}` : `Creada: ${fmtDate(oc.creadoEn)}`}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Señores (Proveedor) / Facturar a ──────────────────────────────── */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Señores</Text>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Razón social</Text>
              <Text style={s.infoValue}>{proveedor.razonSocial}</Text>
            </View>
            {proveedor.ruc && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>RUC</Text>
                <Text style={s.infoValue}>{proveedor.ruc}</Text>
              </View>
            )}
            {proveedor.direccion && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>Dirección</Text>
                <Text style={s.infoValue}>{proveedor.direccion}</Text>
              </View>
            )}
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Enviar a</Text>
              <Text style={s.infoValue}>{oc.lugarEntrega ?? 'Por coordinar'}</Text>
            </View>
            {oc.concepto && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>Lo siguiente</Text>
                <Text style={s.infoValue}>{oc.concepto}</Text>
              </View>
            )}
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Obra</Text>
              <Text style={s.infoValue}>
                {oc.proyecto.codigo ? `${oc.proyecto.codigo} — ` : ''}{oc.proyecto.nombre}
              </Text>
            </View>
            {oc.referencia && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>Referencia</Text>
                <Text style={s.infoValue}>{oc.referencia}</Text>
              </View>
            )}
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Facturar a nombre de</Text>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Razón social</Text>
              <Text style={s.infoValue}>{EMPRESA.razonSocial}</Text>
            </View>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>RUC</Text>
              <Text style={s.infoValue}>{EMPRESA.ruc}</Text>
            </View>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Dirección</Text>
              <Text style={s.infoValue}>{EMPRESA.direccion}</Text>
            </View>
            <View style={s.dividerThin} />
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Solicitud</Text>
              <Text style={s.infoValue}>{oc.solicitud?.codigo ?? '—'}</Text>
            </View>
            {requerimiento && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>Requerimiento</Text>
                <Text style={s.infoValue}>
                  {requerimiento.codigo} ({TIPO_LABEL[requerimiento.tipo]})
                </Text>
              </View>
            )}
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Tiempo de entrega</Text>
              <Text style={s.infoValue}>{oc.tiempoEntrega ?? 'Por coordinar'}</Text>
            </View>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Fecha de entrega</Text>
              <Text style={s.infoValue}>{oc.fechaEntrega ? fmtDate(oc.fechaEntrega) : 'Por coordinar'}</Text>
            </View>
          </View>
        </View>

        {/* ── Tabla de ítems: la cabecera se repite si la lista pasa de página ── */}
        {colHeader}

        {itemsCuerpo.map((item, idx) => renderFila(item, idx))}

        {/* ── Cierre: totales, pago, contactos y firmas — siempre en la misma página ── */}
        <View wrap={false} style={s.closing}>
          {/* Las últimas filas viajan con el cierre: nunca queda una página solo de totales y firmas */}
          {itemsCola.map((item, idx) => renderFila(item, itemsCuerpo.length + idx))}
          <View style={[s.summaryRow, s.closingBlock]}>
            <View style={s.summaryLeft}>
              <Text style={s.sonText}>SON: {numeroALetras(total, proveedor.moneda)}</Text>

              <View style={[s.paymentBox, s.paymentBoxStack]}>
                <View style={s.paymentTitleRow}>
                  <Text style={s.paymentTitle}>Forma de pago</Text>
                  {oc.condicionPago && <Text style={s.paymentCondicion}>Condición: {oc.condicionPago}</Text>}
                </View>
                <View style={s.formaPagoTableHeader}>
                  <Text style={[s.fpThText, s.fpColConcepto]}>Concepto</Text>
                  <Text style={[s.fpThText, s.fpColPct]}>%</Text>
                  <Text style={[s.fpThText, s.fpColBruto]}>Bruto</Text>
                  {tieneFiscal && <Text style={[s.fpThText, s.fpColDetraccion]}>{fiscalLabel}</Text>}
                  <Text style={[s.fpThText, s.fpColNeto]}>Neto</Text>
                </View>
                {filasPago.map((fila, index) => (
                  <View key={index} style={s.formaPagoRow}>
                    <Text style={[s.fpTdText, s.fpColConcepto]}>{fila.concepto}</Text>
                    <Text style={[s.fpTdText, s.fpColPct]}>{fmtPercent(fila.porcentaje)}</Text>
                    <Text style={[s.fpTdText, s.fpColBruto]}>{fmtMoney(fila.bruto)}</Text>
                    {tieneFiscal && <Text style={[s.fpTdText, s.fpColDetraccion]}>{fmtMoney(fila.detraccion)}</Text>}
                    <Text style={[s.fpTdText, s.fpColNeto]}>{fmtMoney(fila.neto)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.summaryRight}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>V. Compra (sin IGV)</Text>
                <Text style={s.totalValue}>{fmtMoney(subtotal)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>IGV (18%)</Text>
                <Text style={s.totalValue}>{fmtMoney(igv)}</Text>
              </View>
              <View style={s.grandTotalRow}>
                <Text style={s.grandTotalLabel}>TOTAL</Text>
                <Text style={s.grandTotalValue}>{fmtMoney(total)}</Text>
              </View>
              {tipoCambio > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Tipo de cambio</Text>
                  <Text style={s.totalValue}>
                    {tipoCambio.toLocaleString('es-PE', { maximumFractionDigits: 4 })}
                  </Text>
                </View>
              )}
              {descuentoMonto > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Descuento</Text>
                  <Text style={s.totalValue}>− {fmtMoney(descuentoMonto)}</Text>
                </View>
              )}
              {mostrarNeto && (
                <View style={s.netoRow}>
                  <Text style={[s.totalLabel, { fontFamily: 'Helvetica-Bold', color: C.navy }]}>Neto a pagar</Text>
                  <Text style={[s.totalValue, { color: C.navy }]}>{fmtMoney(totalNetoAPagar)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Contacto proveedor / Contacto D&C ──────────────────────────── */}
          <View style={[s.paymentRow, s.closingBlock]}>
            <View style={s.paymentBox}>
              <Text style={s.paymentTitle}>Contacto proveedor</Text>
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Contacto</Text>
                <Text style={s.paymentValue}>
                  {oc.contactoProveedorNombre ?? contactoProveedor?.nombre ?? '—'}
                </Text>
              </View>
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Teléfono</Text>
                <Text style={s.paymentValue}>
                  {oc.contactoProveedorTelefono ?? contactoProveedor?.telefono ?? '—'}
                </Text>
              </View>
              {(proveedor.banco || proveedor.numeroCuenta) && (
                <View style={s.paymentLine}>
                  <Text style={s.paymentLabel}>Cta / CCI</Text>
                  <Text style={s.paymentValue}>
                    {proveedor.banco && `${proveedor.banco} · `}
                    {proveedor.numeroCuenta ?? '—'}
                  </Text>
                </View>
              )}
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Moneda</Text>
                <Text style={s.paymentValue}>{proveedor.moneda ?? 'Soles'}</Text>
              </View>
            </View>

            <View style={s.paymentBox}>
              <Text style={s.paymentTitle}>Contacto D&amp;C</Text>
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Contacto</Text>
                <Text style={s.paymentValue}>{oc.contactoDycNombre ?? 'Ruben Soplapuco Garcia'}</Text>
              </View>
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Área</Text>
                <Text style={s.paymentValue}>{oc.contactoDycArea ?? 'ADMINISTRACIÓN'}</Text>
              </View>
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Celular</Text>
                <Text style={s.paymentValue}>{oc.contactoDycCelular ?? '979228332'}</Text>
              </View>
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Teléfono D&amp;C</Text>
                <Text style={s.paymentValue}>{oc.contactoDycTelefono ?? '074-238554'}</Text>
              </View>
            </View>
          </View>

          {/* ── Notas ───────────────────────────────────────────────────────── */}
          {oc.nota && (
            <View style={[s.notesBlock, s.closingBlock]}>
              <Text style={s.notesLabel}>Notas</Text>
              <Text style={s.notesText}>{oc.nota}</Text>
            </View>
          )}

          {/* ── Reserva de derecho ───────────────────────────────────────────── */}
          <Text style={[s.reserveText, s.closingBlock]}>
            Nos reservamos el derecho de devolver la mercadería que no esté de acuerdo con nuestras especificaciones.
          </Text>

          {/* ── Firmas: Administración y Logística juntas a la izquierda; a la derecha, espacio para quien Recibe ── */}
          <View style={s.signatureRow}>
            <View style={s.signatureCol}>
              <Image src={FIRMA_JEFE_ADMIN} style={s.signatureImage} />
              <View style={s.signatureLine} />
              <Text style={s.signatureTitle}>Jefe de Administración</Text>
            </View>
            <View style={s.signatureCol}>
              <Image src={FIRMA_LOGISTICA} style={s.signatureImage} />
              <View style={s.signatureLine} />
              <Text style={s.signatureTitle}>Logística</Text>
            </View>
            <View style={s.signatureCol}>
              <View style={s.signatureSpace} />
              <View style={s.signatureLine} />
              <Text style={s.signatureTitle}>Recibe</Text>
            </View>
          </View>
        </View>

        {/* ── Footer fijo ─────────────────────────────────────────────────── */}
        <View fixed style={s.footer}>
          <Text style={s.footerText}>
            Generado por DyC ERP · {new Date().toLocaleDateString('es-PE')}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${oc.numero} · Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
