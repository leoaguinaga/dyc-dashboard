import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { OrdenCompra, TipoRequerimiento } from '@/types/api'
import { numeroALetras } from '@/lib/numero-a-letras'

// Use built-in font families (Helvetica ships with @react-pdf/renderer)
Font.register({
  family: 'Helvetica',
  fonts: [],
})
// Avoid react-pdf's automatic word hyphenation (e.g. "Chi-clayo")
Font.registerHyphenationCallback((word) => [word])

const EMPRESA = {
  razonSocial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC',
  nombreComercial: 'DyC Ingeniería y Proyectos',
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
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 44,
    backgroundColor: C.white,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  companyBlock: { gap: 2, maxWidth: 300 },
  companyName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 0.3 },
  companyTagline: { fontSize: 7, color: C.muted, marginTop: 2 },
  companyRuc: { fontSize: 8, color: C.muted },
  companyAddress: { fontSize: 8, color: C.muted },
  docBlock: { alignItems: 'flex-end', gap: 3 },
  docLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.blue, letterSpacing: 0.5, textAlign: 'right' },
  docSubLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.muted, letterSpacing: 0.4, textAlign: 'right' },
  docNumero: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.navy },
  docNombre: { fontSize: 9, color: C.text, textAlign: 'right' },
  docFecha: { fontSize: 8, color: C.muted },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: { borderBottomWidth: 2, borderBottomColor: C.navy, marginBottom: 14 },
  dividerThin: { borderBottomWidth: 0.5, borderBottomColor: C.border, marginVertical: 10 },

  // ── Info row ─────────────────────────────────────────────────────────────
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
    gap: 4,
  },
  infoBoxTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.blue, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  infoLine: { flexDirection: 'row', gap: 4 },
  infoLabel: { fontSize: 8, color: C.muted, width: 68 },
  infoValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },

  // ── Delivery ─────────────────────────────────────────────────────────────
  deliveryRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.lightGray,
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  deliveryItem: { flex: 1, gap: 2 },
  deliveryLabel: { fontSize: 7, color: C.muted, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  deliveryValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.navy },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: C.lightGray },
  thText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.3 },
  tdText: { fontSize: 8.5 },
  colCod: { width: 46 },
  colCant: { width: 42, textAlign: 'right' },
  colUnid: { width: 40, textAlign: 'center' },
  colDesc: { flex: 1 },
  colPUnit: { width: 62, textAlign: 'right' },
  colTotal: { width: 66, textAlign: 'right' },

  // ── Forma de pago / Banca ────────────────────────────────────────────────
  paymentRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  paymentBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
    gap: 4,
  },
  paymentBoxNarrow: { flex: 0.75 },
  paymentTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.blue, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  paymentLine: { flexDirection: 'row', gap: 4 },
  paymentLabel: { fontSize: 8, color: C.muted, width: 92 },
  paymentValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },

  // ── Forma de pago (tabla de tramos) ─────────────────────────────────────
  formaPagoTableHeader: {
    flexDirection: 'row',
    backgroundColor: C.lightGray,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  formaPagoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  fpThText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase' },
  fpTdText: { fontSize: 8 },
  fpColConcepto: { flex: 1.3 },
  fpColPct: { width: 28, textAlign: 'right' },
  fpColBruto: { width: 60, textAlign: 'right' },
  fpColNeto: { width: 68, textAlign: 'right' },

  // ── Monto en letras ──────────────────────────────────────────────────────
  sonRow: { marginTop: 8, padding: 6 },
  sonText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy },

  // ── Firma (no absoluta, dos columnas) ───────────────────────────────────
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 24 },
  signatureCol: { flex: 1, alignItems: 'center', gap: 4 },

  // ── Totals ─────────────────────────────────────────────────────────────────
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 3,
  },
  totalRow: { flexDirection: 'row', gap: 8 },
  totalLabel: { fontSize: 8, color: C.muted, width: 100, textAlign: 'right' },
  totalValue: { fontSize: 8, width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 2,
    gap: 8,
  },
  grandTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white, width: 100, textAlign: 'right' },
  grandTotalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white, width: 80, textAlign: 'right' },

  // ── Notes ──────────────────────────────────────────────────────────────────
  notesBlock: { marginTop: 10, padding: 8, borderWidth: 0.5, borderColor: C.border, borderRadius: 4, gap: 3 },
  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  notesText: { fontSize: 8, color: C.text },

  // ── Reserva de derecho ──────────────────────────────────────────────────
  reserveText: { fontSize: 7.5, color: C.muted, marginTop: 10, lineHeight: 1.4 },

  // ── Signature ──────────────────────────────────────────────────────────────
  signatureLine: { borderBottomWidth: 1, borderBottomColor: C.text, width: 160, marginBottom: 4 },
  signatureTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'center' },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
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

function fmtMoney(n: string | number) {
  return `S/ ${parseFloat(String(n)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  oc: OrdenCompra
}

export function OcPdfDocument({ oc }: Props) {
  const subtotal = oc.items.reduce((sum, i) => sum + parseFloat(i.precioTotal), 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const adelantoPct = oc.adelantoPorcentaje ? parseFloat(oc.adelantoPorcentaje) : 50
  const saldoPct = oc.saldoPorcentaje ? parseFloat(oc.saldoPorcentaje) : 50
  const detraccionPct = oc.detraccionPorcentaje ? parseFloat(oc.detraccionPorcentaje) : 10

  const adelantoBruto = total * (adelantoPct / 100)
  const saldoBruto = total * (saldoPct / 100)
  const adelantoNeto = adelantoBruto * (1 - detraccionPct / 100)
  const saldoNeto = saldoBruto * (1 - detraccionPct / 100)
  const detraccionTotal = total * (detraccionPct / 100)
  const netoADepositarTotal = total - detraccionTotal

  const requerimiento = oc.solicitud.requerimiento
  const contactoProveedor = oc.proveedor.contactos?.[0]

  return (
    <Document
      title={`${oc.numero} - Orden de Compra`}
      author="D&C Ingeniería y Proyectos"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.companyBlock}>
            <Text style={s.companyName}>{EMPRESA.nombreComercial}</Text>
            <Text style={s.companyTagline}>{EMPRESA.tagline}</Text>
          </View>
          <View style={s.docBlock}>
            <Text style={s.docLabel}>ORDEN DE COMPRA</Text>
            <Text style={s.docSubLabel}>GUÍA DE INTERNAMIENTO</Text>
            <Text style={s.docNumero}>N° {oc.numero}</Text>
            {oc.nombre && <Text style={s.docNombre}>{oc.nombre}</Text>}
            <Text style={s.docFecha}>
              {oc.fechaEmision ? `Emitida: ${fmtDate(oc.fechaEmision)}` : `Creada: ${fmtDate(oc.creadoEn)}`}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Señores (Proveedor) ───────────────────────────────────────────── */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Señores</Text>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Razón social</Text>
              <Text style={s.infoValue}>{oc.proveedor.razonSocial}</Text>
            </View>
            {oc.proveedor.ruc && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>RUC</Text>
                <Text style={s.infoValue}>{oc.proveedor.ruc}</Text>
              </View>
            )}
            {oc.proveedor.direccion && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>Dirección</Text>
                <Text style={s.infoValue}>{oc.proveedor.direccion}</Text>
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
              <Text style={s.infoValue}>{oc.solicitud.codigo}</Text>
            </View>
            {requerimiento && (
              <View style={s.infoLine}>
                <Text style={s.infoLabel}>Requerimiento</Text>
                <Text style={s.infoValue}>
                  {requerimiento.codigo} ({TIPO_LABEL[requerimiento.tipo]})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Tabla de ítems ──────────────────────────────────────────────── */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colCod]}>Cod.</Text>
          <Text style={[s.thText, s.colCant]}>Cant.</Text>
          <Text style={[s.thText, s.colUnid]}>U.D.M</Text>
          <Text style={[s.thText, s.colDesc]}>Descripción</Text>
          <Text style={[s.thText, s.colPUnit]}>P. Unitario</Text>
          <Text style={[s.thText, s.colTotal]}>P. Total</Text>
        </View>

        {oc.items.map((item, idx) => (
          <View key={item.id} style={[s.tableRow, idx % 2 !== 0 ? s.tableRowAlt : {}]}>
            <Text style={[s.tdText, s.colCod]}>{item.codigo ?? String(idx + 1)}</Text>
            <Text style={[s.tdText, s.colCant]}>
              {parseFloat(item.cantidad).toLocaleString('es-PE')}
            </Text>
            <Text style={[s.tdText, s.colUnid]}>{item.unidad}</Text>
            <Text style={[s.tdText, s.colDesc]}>{item.descripcion}</Text>
            <Text style={[s.tdText, s.colPUnit]}>{fmtMoney(item.precioUnitario)}</Text>
            <Text style={[s.tdText, s.colTotal]}>{fmtMoney(item.precioTotal)}</Text>
          </View>
        ))}

        {/* ── Totales (V. Compra / IGV / Total) ────────────────────────────── */}
        <View style={s.totalsBlock}>
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
        </View>

        {/* ── Monto en letras ─────────────────────────────────────────────── */}
        <View style={s.sonRow}>
          <Text style={s.sonText}>SON: {numeroALetras(total, oc.proveedor.moneda)}</Text>
        </View>

        {/* ── Forma de pago (tramos) / Tipo de cambio ──────────────────────── */}
        <View style={s.paymentRow}>
          <View style={[s.paymentBox, { flex: 1.4 }]}>
            <Text style={s.paymentTitle}>Forma de pago</Text>
            {oc.condicionPago && (
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Condición</Text>
                <Text style={s.paymentValue}>{oc.condicionPago}</Text>
              </View>
            )}
            <View style={s.formaPagoTableHeader}>
              <Text style={[s.fpThText, s.fpColConcepto]}>Concepto</Text>
              <Text style={[s.fpThText, s.fpColPct]}>%</Text>
              <Text style={[s.fpThText, s.fpColBruto]}>Bruto</Text>
              <Text style={[s.fpThText, s.fpColNeto]}>Neto a depositar</Text>
            </View>
            <View style={s.formaPagoRow}>
              <Text style={[s.fpTdText, s.fpColConcepto]}>Adelanto a la emisión de la OC</Text>
              <Text style={[s.fpTdText, s.fpColPct]}>{adelantoPct}%</Text>
              <Text style={[s.fpTdText, s.fpColBruto]}>{fmtMoney(adelantoBruto)}</Text>
              <Text style={[s.fpTdText, s.fpColNeto]}>{fmtMoney(adelantoNeto)}</Text>
            </View>
            <View style={s.formaPagoRow}>
              <Text style={[s.fpTdText, s.fpColConcepto]}>Saldo al término de obra</Text>
              <Text style={[s.fpTdText, s.fpColPct]}>{saldoPct}%</Text>
              <Text style={[s.fpTdText, s.fpColBruto]}>{fmtMoney(saldoBruto)}</Text>
              <Text style={[s.fpTdText, s.fpColNeto]}>{fmtMoney(saldoNeto)}</Text>
            </View>
          </View>

          <View style={[s.paymentBox, s.paymentBoxNarrow]}>
            <Text style={s.paymentTitle}>Tipo de cambio</Text>
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>Total</Text>
              <Text style={s.paymentValue}>{oc.tipoCambio ?? '0'}</Text>
            </View>
            <Text style={[s.paymentTitle, { marginTop: 8 }]}>Detracción</Text>
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>{detraccionPct}%</Text>
              <Text style={s.paymentValue}>{fmtMoney(detraccionTotal)}</Text>
            </View>
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>Total</Text>
              <Text style={s.paymentValue}>{fmtMoney(netoADepositarTotal)}</Text>
            </View>
          </View>
        </View>

        {/* ── Contacto proveedor / Contacto D&C ────────────────────────────── */}
        <View style={s.paymentRow}>
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
            {(oc.proveedor.banco || oc.proveedor.numeroCuenta) && (
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Cta / CCI</Text>
                <Text style={s.paymentValue}>
                  {oc.proveedor.banco && `${oc.proveedor.banco} · `}
                  {oc.proveedor.numeroCuenta ?? '—'}
                </Text>
              </View>
            )}
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>Moneda</Text>
              <Text style={s.paymentValue}>{oc.proveedor.moneda ?? 'Soles'}</Text>
            </View>
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>Tiempo de entrega</Text>
              <Text style={s.paymentValue}>{oc.tiempoEntrega ?? 'Por coordinar'}</Text>
            </View>
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>Fecha de entrega</Text>
              <Text style={s.paymentValue}>{oc.fechaEntrega ? fmtDate(oc.fechaEntrega) : 'Por coordinar'}</Text>
            </View>
          </View>

          <View style={s.paymentBox}>
            <Text style={s.paymentTitle}>Contacto D&amp;C</Text>
            <View style={s.paymentLine}>
              <Text style={s.paymentLabel}>Contacto</Text>
              <Text style={s.paymentValue}>{oc.contactoDycNombre ?? oc.creadoPor.name}</Text>
            </View>
            {oc.contactoDycArea && (
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Área</Text>
                <Text style={s.paymentValue}>{oc.contactoDycArea}</Text>
              </View>
            )}
            {oc.contactoDycCelular && (
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Celular</Text>
                <Text style={s.paymentValue}>{oc.contactoDycCelular}</Text>
              </View>
            )}
            {oc.contactoDycTelefono && (
              <View style={s.paymentLine}>
                <Text style={s.paymentLabel}>Teléfono D&amp;C</Text>
                <Text style={s.paymentValue}>{oc.contactoDycTelefono}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Notas ───────────────────────────────────────────────────────── */}
        {oc.nota && (
          <View style={s.notesBlock}>
            <Text style={s.notesLabel}>Notas</Text>
            <Text style={s.notesText}>{oc.nota}</Text>
          </View>
        )}

        {/* ── Reserva de derecho ───────────────────────────────────────────── */}
        <Text style={s.reserveText}>
          Nos reservamos el derecho de devolver la mercadería que no esté de acuerdo con nuestras especificaciones.
        </Text>

        {/* ── Firma ───────────────────────────────────────────────────────── */}
        <View style={s.signatureRow}>
          <View style={s.signatureCol}>
            <View style={s.signatureLine} />
            <Text style={s.signatureTitle}>Jefe de Administración</Text>
          </View>
          <View style={s.signatureCol}>
            <View style={s.signatureLine} />
            <Text style={s.signatureTitle}>Logística</Text>
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Generado por DyC ERP · {new Date().toLocaleDateString('es-PE')}
          </Text>
          <Text style={s.footerText}>{oc.numero}</Text>
        </View>
      </Page>
    </Document>
  )
}
