'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Requerimiento } from '@/types/api'

const UNIDAD_LABEL: Record<string, string> = {
  und: 'und', kg: 'kg', m: 'm', m2: 'm²', m3: 'm³', l: 'l',
  gal: 'gal', bolsa: 'bolsa', caja: 'caja', rollo: 'rollo', par: 'par', juego: 'juego',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#111' },
  header: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  companyBlock: {},
  company: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  companyRuc: { fontSize: 9.5, color: '#888' },
  reqBadge: { backgroundColor: '#1e293b', borderRadius: 6, padding: '8 14', alignItems: 'flex-end' },
  reqBadgeLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  reqBadgeCode: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 0.5 },
  docTitle: { fontSize: 10, color: '#555', marginBottom: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 24, marginBottom: 10 },
  metaBlock: { flex: 1 },
  metaLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  metaValueNormal: { fontSize: 9 },
  alertBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 4, padding: '6 10', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertText: { fontSize: 8, color: '#92400e' },
  sectionTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  thead: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', padding: '5 8' },
  tbody: {},
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trLast: { flexDirection: 'row' },
  td: { fontSize: 9, padding: '6 8', color: '#111' },
  tdMuted: { fontSize: 8, padding: '6 8', color: '#64748b' },
  colN: { width: 28 },
  colDesc: { flex: 1 },
  colQty: { width: 60, textAlign: 'right' },
  colUnit: { width: 48 },
  colNota: { flex: 0.6 },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#aaa' },
  notaBox: { marginTop: 14, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: '8 10' },
  notaLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  notaText: { fontSize: 9 },
  fechaAlert: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#b45309' },
})

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatLugar(proyecto: Requerimiento['proyecto']) {
  const partes = [proyecto.direccion, proyecto.comuna, proyecto.ciudad].filter(Boolean)
  return partes.length ? partes.join(', ') : null
}

function RequerimientoDocument({ r }: { r: Requerimiento }) {
  const generadoEn = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const lugar = formatLugar(r.proyecto)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.companyBlock}>
              <Text style={s.company}>Díaz y Castillo Ingeniería y Proyectos</Text>
              <Text style={s.companyRuc}>RUC 20608745611</Text>
            </View>
            <View style={s.reqBadge}>
              <Text style={s.reqBadgeLabel}>Solicitud de Materiales</Text>
              <Text style={s.reqBadgeCode}>{r.codigo}</Text>
            </View>
          </View>
          <View style={s.divider} />

          <View style={s.row2}>
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>Obra</Text>
              <Text style={s.metaValueNormal}>{r.proyecto.codigo ? `${r.proyecto.codigo} — ${r.proyecto.nombre}` : r.proyecto.nombre}</Text>
            </View>
            {lugar && (
              <View style={s.metaBlock}>
                <Text style={s.metaLabel}>Lugar</Text>
                <Text style={s.metaValueNormal}>{lugar}</Text>
              </View>
            )}
          </View>

          <View style={s.row2}>
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>Solicitante</Text>
              <Text style={s.metaValueNormal}>{r.creadoPor.name}</Text>
            </View>
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>Generado</Text>
              <Text style={s.metaValueNormal}>{generadoEn}</Text>
            </View>
            {r.fechaEntregaRequerida && (
              <View style={s.metaBlock}>
                <Text style={s.metaLabel}>Entrega requerida</Text>
                <Text style={s.fechaAlert}>{fmtDate(r.fechaEntregaRequerida)}</Text>
              </View>
            )}
          </View>

          {r.urgente && (
            <View style={[s.alertBox, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <Text style={[s.alertText, { color: '#991b1b' }]}>⚠  Requerimiento urgente — se requiere cotización a la brevedad</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <Text style={s.sectionTitle}>Materiales / equipos solicitados</Text>
        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.colN]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Descripción</Text>
            <Text style={[s.th, s.colQty]}>Cantidad</Text>
            <Text style={[s.th, s.colUnit]}>Unidad</Text>
            <Text style={[s.th, s.colNota]}>Especificación</Text>
          </View>
          <View style={s.tbody}>
            {r.items.map((item, i) => {
              const isLast = i === r.items.length - 1
              return (
                <View key={item.id} style={isLast ? s.trLast : s.tr}>
                  <Text style={[s.tdMuted, s.colN]}>{i + 1}</Text>
                  <Text style={[s.td, s.colDesc]}>{item.descripcion}</Text>
                  <Text style={[s.td, s.colQty]}>{Number(item.cantidad).toLocaleString('es-PE')}</Text>
                  <Text style={[s.tdMuted, s.colUnit]}>{UNIDAD_LABEL[item.unidad] ?? item.unidad}</Text>
                  <Text style={[s.tdMuted, s.colNota]}>{item.nota ?? '—'}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {r.nota && (
          <View style={s.notaBox}>
            <Text style={s.notaLabel}>Nota del solicitante</Text>
            <Text style={s.notaText}>{r.nota}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>DyC Ingeniería y Proyectos — Documento interno</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function downloadRequerimientoPDF(r: Requerimiento) {
  const blob = await pdf(<RequerimientoDocument r={r} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${r.codigo}-solicitud-materiales.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
