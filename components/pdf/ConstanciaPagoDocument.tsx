import fs from "fs";
import path from "path";
import React from "react";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Pago } from "@/types/api";
import { getBeneficiario, getDestinoPago } from "@/lib/pagos-utils";

const FIRMA_JEFE_ADMIN = fs.readFileSync(
  path.join(process.cwd(), "public", "signatures", "jefe-admin.jpg"),
);

Font.register({ family: "Helvetica", fonts: [] });
Font.registerHyphenationCallback((word) => [word]);

const EMPRESA = {
  razonSocial: "DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC",
  ruc: "20608745611",
  direccion:
    "Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque",
};

const C = {
  navy: "#1a3557",
  blue: "#2563a8",
  paleBlue: "#eef4fb",
  paleGreen: "#edf8f1",
  green: "#166534",
  border: "#cbd5e1",
  text: "#111827",
  muted: "#64748b",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    paddingTop: 38,
    paddingBottom: 42,
    paddingHorizontal: 42,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  company: { maxWidth: 330, gap: 3 },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    letterSpacing: 0.2,
  },
  companyDetail: { fontSize: 7.5, color: C.muted },
  document: { alignItems: "flex-end", gap: 3 },
  documentTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.blue,
    letterSpacing: 0.5,
  },
  documentNumber: { fontSize: 8, color: C.muted },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: C.navy,
    marginBottom: 14,
  },
  summary: {
    flexDirection: "row",
    borderWidth: 0.7,
    borderColor: C.navy,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  summaryMain: { flex: 1, padding: 11, backgroundColor: C.paleBlue, gap: 3 },
  summaryAmount: {
    width: 155,
    padding: 11,
    backgroundColor: C.navy,
    gap: 3,
    alignItems: "flex-end",
  },
  label: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  summaryConcept: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.navy },
  amountLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  amount: { fontSize: 17, fontFamily: "Helvetica-Bold", color: C.white },
  status: { fontSize: 8, color: "#bbf7d0", fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  box: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
    gap: 5,
  },
  row: { flexDirection: "row", gap: 6 },
  rowLabel: { width: 104, fontSize: 7.5, color: C.muted },
  rowValue: { flex: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  note: {
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
    fontSize: 8,
    lineHeight: 1.45,
    color: C.text,
  },
  closure: {
    flexDirection: "row",
    gap: 18,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  signature: { width: 220, alignItems: "center", paddingTop: 2 },
  signatureImage: { width: 125, height: 48, objectFit: "contain" },
  signatureLine: {
    width: 180,
    borderBottomWidth: 0.8,
    borderBottomColor: C.text,
    marginBottom: 4,
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    textAlign: "center",
  },
  signatureSub: {
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
    marginTop: 2,
  },
  print: { flex: 1, paddingTop: 26, gap: 5 },
  printText: { fontSize: 7.5, color: C.muted },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 6.5, color: C.muted },
});

function date(iso?: string | null) {
  if (!iso) return "No registrado";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function printedAt(iso: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(iso));
}

function money(value: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value));
}

function value(text?: string | null) {
  return text?.trim() || "No registrado";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

interface Props {
  pago: Pago;
  generadoEn: string;
}

export function ConstanciaPagoDocument({ pago, generadoEn }: Props) {
  const beneficiario = getBeneficiario(pago);
  const destino = getDestinoPago(pago);
  const proyecto = pago.proyecto ?? pago.ordenCompra?.proyecto;
  const cuenta = destino.numero ?? pago.numeroCuenta;
  const referencia = pago.numeroOperacion || pago.id.slice(-8).toUpperCase();
  const concepto =
    pago.concepto ?? pago.ordenCompra?.concepto ?? "Pago registrado";

  return (
    <Document
      title={`Constancia de pago ${referencia}`}
      author="D&C Ingeniería y Proyectos"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.company}>
            <Text style={s.companyName}>{EMPRESA.razonSocial}</Text>
            <Text style={s.companyDetail}>RUC N° {EMPRESA.ruc}</Text>
            <Text style={s.companyDetail}>{EMPRESA.direccion}</Text>
          </View>
          <View style={s.document}>
            <Text style={s.documentTitle}>CONSTANCIA DE PAGO</Text>
            <Text style={s.documentNumber}>Referencia: {referencia}</Text>
            <Text style={s.documentNumber}>Emitida: {date(generadoEn)}</Text>
          </View>
        </View>
        <View style={s.divider} />

        <View style={s.summary}>
          <View style={s.summaryMain}>
            <Text style={s.label}>Detalle del gasto</Text>
            <Text style={s.summaryConcept}>{concepto}</Text>
            <Text style={s.label}>Beneficiario: {beneficiario}</Text>
          </View>
          <View style={s.summaryAmount}>
            <Text style={s.amountLabel}>Importe pagado</Text>
            <Text style={s.amount}>{money(pago.monto)}</Text>
            <Text style={s.status}>PAGO REALIZADO</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Información de la obligación</Text>
          <View style={s.twoCol}>
            <View style={s.box}>
              <Detail
                label="N° de subcomprobante"
                value={pago.id.slice(-8).toUpperCase()}
              />
              <Detail label="Tipo de gasto" value={value(pago.categoria)} />
              <Detail label="Responsable" value={pago.registradoPor.name} />
              <Detail label="Proveedor" value={beneficiario} />
            </View>
            <View style={s.box}>
              <Detail
                label="Centro de costo"
                value={
                  proyecto
                    ? `${proyecto.codigo ? `${proyecto.codigo} - ` : ""}${proyecto.nombre}`
                    : "Administración / Oficina"
                }
              />
              <Detail
                label="Documento fuente"
                value={value(pago.ordenCompra?.numero)}
              />
              <Detail
                label="Comprobantes asociados"
                value={
                  pago.comprobanteNombre
                    ? pago.comprobanteNombre
                    : "No registrado"
                }
              />
              <Detail label="Detracción" value="No registrado" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ejecución del pago</Text>
          <View style={s.twoCol}>
            <View style={s.box}>
              <Detail
                label="Tipo de operación"
                value={value(pago.metodoPago)}
              />
              <Detail label="Fecha de pago" value={date(pago.fechaPagoReal)} />
              <Detail
                label="N° de operación"
                value={value(pago.numeroOperacion)}
              />
            </View>
            <View style={s.box}>
              <Detail
                label="Banco / billetera"
                value={value(destino.bancoNorm)}
              />
              <Detail
                label={
                  destino.numeroLabel === "Cel" ? "Celular" : "N° de cuenta"
                }
                value={value(cuenta)}
              />
              <Detail label="CCI" value={value(destino.cci)} />
            </View>
          </View>
        </View>

        {pago.nota && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Observación</Text>
            <Text style={s.note}>{pago.nota}</Text>
          </View>
        )}

        <View style={s.closure}>
          <View style={s.signature}>
            {/* react-pdf Image does not expose an alt prop. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={FIRMA_JEFE_ADMIN} style={s.signatureImage} />
            <View style={s.signatureLine} />
            <Text style={s.signatureTitle}>CONFORMIDAD DE ADMINISTRACIÓN</Text>
            <Text style={s.signatureSub}>D&C Ingeniería y Proyectos SAC</Text>
          </View>
          <View style={s.print}>
            <Text style={s.label}>Responsable de la rendición</Text>
            <Text style={s.rowValue}>
              {pago.pagadoPor?.name ?? "No registrado"}
            </Text>
            <Text style={s.printText}>
              Fecha programada: {date(pago.fechaProgramada)}
            </Text>
            <Text style={s.printText}>
              Sustento:{" "}
              {pago.comprobanteNombre ? "Archivo registrado" : "No registrado"}
            </Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Constancia generada desde D&C ERP</Text>
          <Text style={s.footerText}>
            Fecha y hora de impresión: {printedAt(generadoEn)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
