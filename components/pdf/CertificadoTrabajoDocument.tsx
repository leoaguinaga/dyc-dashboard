import fs from 'fs'
import path from 'path'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import type { Proyecto } from '@/types/api'

const FIRMA_JEFE_ADMIN = fs.readFileSync(
  path.join(process.cwd(), 'public', 'signatures', 'jefe-admin.jpg'),
)

Font.register({ family: 'Helvetica', fonts: [] })
Font.registerHyphenationCallback((word) => [word])

const EMPRESA = {
  nombreComercial: 'DyC Ingeniería y Proyectos',
  razonSocial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC',
  ruc: '20608745611',
  direccion: 'Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque',
  tagline: 'Ejecutando obras con estándares de salud, seguridad, calidad y protección medio ambiente',
}

const C = {
  navy: '#1a3557',
  blue: '#2563a8',
  gray: '#6b7280',
  border: '#d1d5db',
  text: '#111827',
  muted: '#6b7280',
  white: '#ffffff',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 56,
    backgroundColor: C.white,
  },
  header: { alignItems: 'center', marginBottom: 28 },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 0.3 },
  companyTagline: { fontSize: 7.5, color: C.muted, marginTop: 3, textAlign: 'center' },
  divider: { borderBottomWidth: 2, borderBottomColor: C.navy, marginTop: 14, marginBottom: 32 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'center', letterSpacing: 1, marginBottom: 30 },
  paragraph: { fontSize: 10.5, lineHeight: 1.9, color: C.text, textAlign: 'justify' },
  bold: { fontFamily: 'Helvetica-Bold' },
  detailsBox: {
    marginTop: 28,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    padding: 12,
    gap: 6,
  },
  detailLine: { flexDirection: 'row', gap: 6 },
  detailLabel: { fontSize: 8.5, color: C.muted, width: 120 },
  detailValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', flex: 1 },
  place: { fontSize: 9.5, color: C.muted, marginTop: 36, textAlign: 'right' },
  signatureBlock: { alignItems: 'center', marginTop: 50, gap: 4 },
  signatureImage: { width: 140, height: 60, objectFit: 'contain' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: C.text, width: 200, marginBottom: 4 },
  signatureTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'center' },
  signatureSub: { fontSize: 8, color: C.muted, textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.muted },
})

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props {
  proyecto: Proyecto
  trabajadorId: string
}

export function CertificadoTrabajoDocument({ proyecto, trabajadorId }: Props) {
  const asignacion = proyecto.trabajadores?.find((t) => t.trabajadorId === trabajadorId)
  const trabajador = asignacion?.trabajador
  const ubicacion = [proyecto.ciudad, proyecto.direccion].filter(Boolean).join(', ') || 'Perú'
  const fechaSalida = asignacion?.fechaSalida ?? proyecto.fechaFinReal

  return (
    <Document
      title={`Constancia de trabajo — ${trabajador?.nombre ?? ''}`}
      author="D&C Ingeniería y Proyectos"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.companyName}>{EMPRESA.nombreComercial}</Text>
          <Text style={s.companyTagline}>{EMPRESA.tagline}</Text>
        </View>
        <View style={s.divider} />

        <Text style={s.title}>CONSTANCIA DE TRABAJO</Text>

        <Text style={s.paragraph}>
          {EMPRESA.razonSocial}, identificada con RUC N° {EMPRESA.ruc}, hace constar que{' '}
          <Text style={s.bold}>{trabajador?.nombre ?? '—'}</Text>, identificado(a) con DNI N°{' '}
          <Text style={s.bold}>{trabajador?.dni ?? '—'}</Text>, participó en la obra{' '}
          <Text style={s.bold}>
            {proyecto.codigo ? `${proyecto.codigo} — ` : ''}
            {proyecto.nombre}
          </Text>{' '}
          {trabajador?.cargo && (
            <>
              desempeñando el cargo de <Text style={s.bold}>{trabajador.cargo}</Text>{' '}
            </>
          )}
          durante el periodo comprendido entre el <Text style={s.bold}>{fmtDate(asignacion?.fechaIngreso)}</Text> y
          el <Text style={s.bold}>{fmtDate(fechaSalida)}</Text>.
        </Text>

        <View style={s.detailsBox}>
          <View style={s.detailLine}>
            <Text style={s.detailLabel}>Obra</Text>
            <Text style={s.detailValue}>{proyecto.nombre}</Text>
          </View>
          <View style={s.detailLine}>
            <Text style={s.detailLabel}>Ubicación</Text>
            <Text style={s.detailValue}>{ubicacion}</Text>
          </View>
          {proyecto.cliente && (
            <View style={s.detailLine}>
              <Text style={s.detailLabel}>Cliente</Text>
              <Text style={s.detailValue}>
                {proyecto.cliente.nombreComercial || proyecto.cliente.razonSocial}
              </Text>
            </View>
          )}
          <View style={s.detailLine}>
            <Text style={s.detailLabel}>Periodo</Text>
            <Text style={s.detailValue}>
              {fmtDate(asignacion?.fechaIngreso)} — {fmtDate(fechaSalida)}
            </Text>
          </View>
        </View>

        <Text style={s.paragraph}>
          Se expide la presente constancia a solicitud del interesado(a) para los fines que estime conveniente.
        </Text>

        <Text style={s.place}>Chiclayo, {fmtDate(new Date().toISOString())}</Text>

        <View style={s.signatureBlock}>
          <Image src={FIRMA_JEFE_ADMIN} style={s.signatureImage} />
          <View style={s.signatureLine} />
          <Text style={s.signatureTitle}>Jefe de Administración</Text>
          <Text style={s.signatureSub}>{EMPRESA.nombreComercial}</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>
            Generado por DyC ERP · {new Date().toLocaleDateString('es-PE')}
          </Text>
          <Text style={s.footerText}>{proyecto.codigo ?? proyecto.id}</Text>
        </View>
      </Page>
    </Document>
  )
}
