import fs from "fs";
import path from "path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Pago } from "@/types/api";
import { getBeneficiario, getDestinoPago } from "@/lib/pagos-utils";

const C = {
  navy: "1A3557",
  blue: "2563A8",
  paleBlue: "EEF4FB",
  border: "CBD5E1",
  text: "111827",
  muted: "64748B",
  white: "FFFFFF",
  green: "166534",
};
const border = { style: BorderStyle.SINGLE, size: 4, color: C.border };
const cellBorders = {
  top: border,
  bottom: border,
  left: border,
  right: border,
};
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: C.white },
  bottom: { style: BorderStyle.NONE, size: 0, color: C.white },
  left: { style: BorderStyle.NONE, size: 0, color: C.white },
  right: { style: BorderStyle.NONE, size: 0, color: C.white },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: C.white },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: C.white },
};
const EMPRESA = {
  razonSocial: "DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC",
  ruc: "20608745611",
  direccion:
    "Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque",
};

type Align = "left" | "center" | "right";

function run(
  value: unknown,
  options: { bold?: boolean; size?: number; color?: string } = {},
) {
  return new TextRun({
    text: String(value ?? "No registrado"),
    bold: options.bold,
    font: "Arial",
    size: options.size ?? 17,
    color: options.color ?? C.text,
  });
}

function para(
  value: unknown,
  options: {
    bold?: boolean;
    size?: number;
    color?: string;
    align?: Align;
    after?: number;
  } = {},
) {
  return new Paragraph({
    children: [run(value, options)],
    alignment: options.align,
    spacing: { after: options.after ?? 45 },
  });
}

function date(value?: string | null) {
  if (!value) return "No registrado";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function printedAt(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
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

function detailCell(title: string, rows: Array<[string, string]>) {
  return new TableCell({
    borders: cellBorders,
    margins: { top: 110, bottom: 90, left: 120, right: 120 },
    children: [
      para(title.toUpperCase(), {
        bold: true,
        size: 14,
        color: C.blue,
        after: 70,
      }),
      ...rows.map(
        ([label, content]) =>
          new Paragraph({
            children: [
              run(`${label}: `, { bold: true, size: 15, color: C.muted }),
              run(content, { size: 16 }),
            ],
            spacing: { after: 45 },
          }),
      ),
    ],
  });
}

export async function renderConstanciaPagoWord(pago: Pago) {
  const beneficiario = getBeneficiario(pago);
  const destino = getDestinoPago(pago);
  const proyecto = pago.proyecto ?? pago.ordenCompra?.proyecto;
  const referencia = pago.numeroOperacion || pago.id.slice(-8).toUpperCase();
  const concepto =
    pago.concepto ?? pago.ordenCompra?.concepto ?? "Pago registrado";
  const cuenta = destino.numero ?? pago.numeroCuenta;
  const generadoEn = new Date().toISOString();
  const firmaAdmin = fs.readFileSync(
    path.join(process.cwd(), "public", "signatures", "jefe-admin.jpg"),
  );

  const doc = new Document({
    creator: "DYC ERP",
    title: `Constancia de pago ${referencia}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 760, right: 820, bottom: 820, left: 820 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: C.border },
                },
                spacing: { before: 60 },
                children: [
                  run("Constancia generada desde D&C ERP", {
                    size: 13,
                    color: C.muted,
                  }),
                  new TextRun({
                    text: `\tFecha y hora de impresión: ${printedAt(generadoEn)}`,
                    font: "Arial",
                    size: 13,
                    color: C.muted,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    children: [
                      para(EMPRESA.razonSocial, {
                        bold: true,
                        size: 27,
                        color: C.navy,
                        after: 30,
                      }),
                      para(`RUC N° ${EMPRESA.ruc}`, {
                        size: 14,
                        color: C.muted,
                        after: 20,
                      }),
                      para(EMPRESA.direccion, { size: 14, color: C.muted }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorders,
                    children: [
                      para("CONSTANCIA DE PAGO", {
                        bold: true,
                        size: 21,
                        color: C.blue,
                        align: "right",
                        after: 35,
                      }),
                      para(`Referencia: ${referencia}`, {
                        size: 15,
                        color: C.muted,
                        align: "right",
                        after: 20,
                      }),
                      para(`Emitida: ${date(generadoEn)}`, {
                        size: 15,
                        color: C.muted,
                        align: "right",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 14, color: C.navy },
            },
            spacing: { after: 170 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 5,
                        color: C.navy,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 5,
                        color: C.navy,
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 5,
                        color: C.navy,
                      },
                      right: { style: BorderStyle.NONE },
                    },
                    shading: { fill: C.paleBlue, type: ShadingType.CLEAR },
                    margins: { top: 150, bottom: 150, left: 170, right: 170 },
                    children: [
                      para("DETALLE DEL GASTO", {
                        bold: true,
                        size: 14,
                        color: C.muted,
                        after: 50,
                      }),
                      para(concepto, {
                        bold: true,
                        size: 24,
                        color: C.navy,
                        after: 50,
                      }),
                      para(`BENEFICIARIO: ${beneficiario}`, {
                        bold: true,
                        size: 15,
                        color: C.muted,
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 5,
                        color: C.navy,
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 5,
                        color: C.navy,
                      },
                      left: { style: BorderStyle.NONE },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 5,
                        color: C.navy,
                      },
                    },
                    shading: { fill: C.navy, type: ShadingType.CLEAR },
                    margins: { top: 150, bottom: 150, left: 170, right: 170 },
                    children: [
                      para("IMPORTE PAGADO", {
                        bold: true,
                        size: 14,
                        color: "CBD5E1",
                        align: "right",
                        after: 50,
                      }),
                      para(money(pago.monto), {
                        bold: true,
                        size: 32,
                        color: C.white,
                        align: "right",
                        after: 55,
                      }),
                      para("PAGO REALIZADO", {
                        bold: true,
                        size: 15,
                        color: "BBF7D0",
                        align: "right",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 20 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  detailCell("Información de la obligación", [
                    ["N° de subcomprobante", pago.id.slice(-8).toUpperCase()],
                    ["Tipo de gasto", value(pago.categoria)],
                    ["Responsable", pago.registradoPor.name],
                    ["Proveedor", beneficiario],
                  ]),
                  detailCell("Centro de costo y sustento", [
                    [
                      "Centro de costo",
                      proyecto
                        ? `${proyecto.codigo ? `${proyecto.codigo} - ` : ""}${proyecto.nombre}`
                        : "Administración / Oficina",
                    ],
                    ["Documento fuente", value(pago.ordenCompra?.numero)],
                    ["Comprobantes asociados", value(pago.comprobanteNombre)],
                    ["Detracción", "No registrado"],
                  ]),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 20 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  detailCell("Ejecución del pago", [
                    ["Tipo de operación", value(pago.metodoPago)],
                    ["Fecha de pago", date(pago.fechaPagoReal)],
                    ["N° de operación", value(pago.numeroOperacion)],
                  ]),
                  detailCell("Datos bancarios", [
                    ["Banco / billetera", value(destino.bancoNorm)],
                    [
                      destino.numeroLabel === "Cel"
                        ? "Celular"
                        : "N° de cuenta",
                      value(cuenta),
                    ],
                    ["CCI", value(destino.cci)],
                  ]),
                ],
              }),
            ],
          }),
          ...(pago.nota
            ? [
                new Paragraph({ text: "" }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          borders: cellBorders,
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 120,
                            right: 120,
                          },
                          children: [
                            para("OBSERVACIÓN", {
                              bold: true,
                              size: 14,
                              color: C.blue,
                              after: 60,
                            }),
                            para(pago.nota, { size: 16 }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({ text: "", spacing: { after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    children: [
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: firmaAdmin,
                            transformation: { width: 125, height: 54 },
                            type: "jpg",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      para("____________________________", {
                        align: "center",
                        size: 15,
                        after: 35,
                      }),
                      para("CONFORMIDAD DE ADMINISTRACIÓN", {
                        bold: true,
                        size: 15,
                        color: C.navy,
                        align: "center",
                        after: 20,
                      }),
                      para("D&C Ingeniería y Proyectos SAC", {
                        size: 13,
                        color: C.muted,
                        align: "center",
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorders,
                    children: [
                      para("RESPONSABLE DE LA RENDICIÓN", {
                        bold: true,
                        size: 14,
                        color: C.muted,
                        after: 70,
                      }),
                      para(pago.pagadoPor?.name ?? "No registrado", {
                        bold: true,
                        size: 17,
                        color: C.text,
                        after: 80,
                      }),
                      para(`Fecha programada: ${date(pago.fechaProgramada)}`, {
                        size: 14,
                        color: C.muted,
                        after: 35,
                      }),
                      para(
                        `Sustento: ${pago.comprobanteNombre ? "Archivo registrado" : "No registrado"}`,
                        { size: 14, color: C.muted },
                      ),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
