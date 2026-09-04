import fs from 'fs'
import path from 'path'
import {
  AlignmentType, BorderStyle, Document, Footer, ImageRun, Packer, Paragraph,
  Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx'
import type { OrdenCompra } from '@/types/api'
import { numeroALetras } from '@/lib/numero-a-letras'

const C = { navy: '1A3557', blue: '2563A8', gray: '6B7280', light: 'F3F4F6', border: 'D1D5DB', text: '111827', white: 'FFFFFF' }
const border = { style: BorderStyle.SINGLE, size: 4, color: C.border }
const cellBorders = { top: border, bottom: border, left: border, right: border }
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
const EMPRESA = { razonSocial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC', ruc: '20608745611', direccion: 'Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque', tagline: 'Ejecutando obras con estándares de salud, seguridad, calidad y protección medio ambiente' }
type Align = 'right' | 'left' | 'center'

function run(value: unknown, options: { bold?: boolean; size?: number; color?: string } = {}) { return new TextRun({ text: String(value ?? '—'), bold: options.bold, font: 'Arial', size: options.size ?? 17, color: options.color ?? C.text }) }
function para(value: unknown, options: { bold?: boolean; size?: number; color?: string; align?: Align; after?: number } = {}) { return new Paragraph({ children: [run(value, options)], alignment: options.align, spacing: { after: options.after ?? 50 } }) }
function infoCell(title: string, rows: Array<[string, unknown]>) { return new TableCell({ borders: cellBorders, margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: [para(title.toUpperCase(), { bold: true, size: 14, color: C.blue, after: 70 }), ...rows.map(([label, value]) => new Paragraph({ children: [run(`${label}: `, { bold: true, size: 16, color: C.gray }), run(value, { size: 16 })], spacing: { after: 45 } }))] }) }
function money(value: string | number | null | undefined) { return `S/ ${Number(value ?? 0).toLocaleString('es-PE', { maximumFractionDigits: 1 })}` }
function pct(value: number) { return `${value.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%` }
function date(value?: string | null) { return value ? new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Por coordinar' }
function cell(value: unknown, width?: number, options: { bold?: boolean; color?: string; align?: Align; size?: number; shading?: string } = {}) { return new TableCell({ borders: cellBorders, shading: options.shading ? { fill: options.shading } : undefined, width: width ? { size: width, type: WidthType.DXA } : undefined, margins: { top: 70, bottom: 70, left: 70, right: 70 }, children: [para(value, options)] }) }
function title(value: string) { return para(value.toUpperCase(), { bold: true, size: 14, color: C.blue, after: 55 }) }

export async function renderOcWord(oc: OrdenCompra) {
  const itemsTotal = oc.items.reduce((sum, item) => sum + Number(item.precioTotal), 0)
  const subtotal = Math.round((oc.incluyeIgv ? itemsTotal / 1.18 : itemsTotal) * 10) / 10
  const igv = Math.round((oc.incluyeIgv ? itemsTotal - subtotal : itemsTotal * 0.18) * 10) / 10
  const total = Math.round((oc.incluyeIgv ? itemsTotal : subtotal + igv) * 10) / 10
  const adelantoPct = oc.adelantoPorcentaje ? Number(oc.adelantoPorcentaje) : 50
  const saldoPct = oc.saldoPorcentaje ? Number(oc.saldoPorcentaje) : 50
  const descuento = oc.detraccionPorcentaje ? Number(oc.detraccionPorcentaje) : oc.retencionPorcentaje ? Number(oc.retencionPorcentaje) : 10
  const descuentoLabel = oc.retencionPorcentaje && !oc.detraccionPorcentaje ? 'Retención' : 'Detracción'
  const docLabel = oc.tipo === 'servicio' ? 'ORDEN DE SERVICIO' : 'ORDEN DE COMPRA'
  const proveedor = oc.proveedor
  const contacto = oc.contactoProveedorNombre ?? proveedor?.contactos?.[0]?.nombre ?? '—'
  const telefono = oc.contactoProveedorTelefono ?? proveedor?.contactos?.[0]?.telefono ?? '—'
  const firmaAdmin = fs.readFileSync(path.join(process.cwd(), 'public', 'signatures', 'jefe-admin.jpg'))
  const firmaLogistica = fs.readFileSync(path.join(process.cwd(), 'public', 'signatures', 'logistica.jpg'))
  const widths = [650, 600, 580, 4300, 900, 950]
  const itemRows = [
    new TableRow({ children: ['Cod.', 'Cant.', 'U.D.M', 'Descripción', 'P. Unitario', 'P. Total'].map((value, index) => cell(value, widths[index], { bold: true, color: C.white, size: 14, shading: C.navy, align: index === 3 ? 'left' : index === 0 || index === 2 ? 'center' : 'right' })) }),
    ...oc.items.map((item, index) => new TableRow({ children: [item.codigo ?? String(index + 1), Number(item.cantidad).toLocaleString('es-PE'), item.unidad, item.descripcion, money(item.precioUnitario), money(item.precioTotal)].map((value, cellIndex) => cell(value, widths[cellIndex], { size: 17, align: cellIndex === 3 ? 'left' : cellIndex === 0 || cellIndex === 2 ? 'center' : 'right' })) })),
  ]
  const paymentRows = [
    new TableRow({ children: [cell('Concepto', 3100, { bold: true, color: C.gray, size: 13 }), cell('%', 450, { bold: true, color: C.gray, size: 13, align: 'right' }), cell('Bruto', 850, { bold: true, color: C.gray, size: 13, align: 'right' }), cell('Neto a depositar', 1050, { bold: true, color: C.gray, size: 13, align: 'right' })] }),
    new TableRow({ children: [cell('Adelanto a la emisión de la OC', 3100), cell(pct(adelantoPct), 450, { align: 'right' }), cell(money(total * adelantoPct / 100), 850, { align: 'right' }), cell(money(total * adelantoPct / 100 * (1 - descuento / 100)), 1050, { align: 'right' })] }),
    new TableRow({ children: [cell('Saldo al término de obra', 3100), cell(pct(saldoPct), 450, { align: 'right' }), cell(money(total * saldoPct / 100), 850, { align: 'right' }), cell(money(total * saldoPct / 100 * (1 - descuento / 100)), 1050, { align: 'right' })] }),
  ]
  const paymentBox = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: cellBorders, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [title('Forma de pago'), para(`Condición: ${oc.condicionPago ?? 'Por coordinar'}`, { size: 16 }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: paymentRows })] }), new TableCell({ borders: cellBorders, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [title('Tipo de cambio'), para(`Total: ${oc.tipoCambio ?? '0'}`, { size: 16 }), title(descuentoLabel), para(`${pct(descuento)} · ${money(total * descuento / 100)}`, { size: 16 }), para(`Total neto: ${money(total * (1 - descuento / 100))}`, { bold: true, size: 16 })] })] })] })
  const doc = new Document({ creator: 'DYC ERP', title: `${oc.numero} - ${docLabel}`, sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 800, right: 880, bottom: 900, left: 880 } } },
    footers: { default: new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border } }, spacing: { before: 60 }, children: [run(`Generado por DyC ERP · ${new Date().toLocaleDateString('es-PE')}`, { size: 14, color: C.gray }), new TextRun({ text: `\t${oc.numero}`, font: 'Arial', size: 14, color: C.gray })] })] }) },
    children: [
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: noBorders, children: [para(EMPRESA.razonSocial, { bold: true, size: 28, color: C.navy, after: 30 }), para(EMPRESA.tagline, { size: 13, color: C.gray })] }), new TableCell({ borders: noBorders, children: [para(docLabel, { bold: true, size: 22, color: C.blue, align: 'right', after: 20 }), para('GUÍA DE INTERNAMIENTO', { bold: true, size: 14, color: C.gray, align: 'right' }), para(`N° ${oc.numero}`, { bold: true, size: 25, color: C.navy, align: 'right' }), para(`${oc.nombre ?? ''}\n${oc.fechaEmision ? `Emitida: ${date(oc.fechaEmision)}` : `Creada: ${date(oc.creadoEn)}`}`, { size: 15, color: C.gray, align: 'right' })] })] })] }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: C.navy } }, spacing: { after: 170 } }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [infoCell('Señores', [['Razón social', proveedor?.razonSocial ?? oc.proveedorNombreLibre], ['RUC', proveedor?.ruc], ['Dirección', proveedor?.direccion], ['Enviar a', oc.lugarEntrega], ['Lo siguiente', oc.concepto], ['Obra', `${oc.proyecto.codigo ? `${oc.proyecto.codigo} — ` : ''}${oc.proyecto.nombre}`], ['Referencia', oc.referencia]]), infoCell('Facturar a nombre de', [['Razón social', EMPRESA.razonSocial], ['RUC', EMPRESA.ruc], ['Dirección', EMPRESA.direccion], ['Solicitud', oc.solicitud?.codigo], ['Requerimiento', oc.solicitud?.requerimiento?.codigo]])] })] }),
      new Paragraph({ text: '' }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: itemRows }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: noBorders, children: [para('SON: ' + numeroALetras(total, proveedor?.moneda), { bold: true, size: 16, color: C.navy })] }), new TableCell({ borders: noBorders, children: [para(`V. Compra (sin IGV): ${money(subtotal)}`, { size: 16, color: C.gray, align: 'right' }), para(`IGV (18%): ${money(igv)}`, { size: 16, color: C.gray, align: 'right' }), new Paragraph({ shading: { fill: C.navy }, children: [run(`TOTAL: ${money(total)}`, { bold: true, size: 19, color: C.white })], alignment: AlignmentType.RIGHT })] })] })] }),
      new Paragraph({ text: '' }), paymentBox,
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [infoCell('Contacto proveedor', [['Contacto', contacto], ['Teléfono', telefono], ['Cta / CCI', `${proveedor?.banco ?? '—'} · ${proveedor?.numeroCuenta ?? '—'}`], ['Moneda', proveedor?.moneda ?? 'Soles'], ['Tiempo de entrega', oc.tiempoEntrega], ['Fecha de entrega', date(oc.fechaEntrega)]]), infoCell('Contacto D&C', [['Contacto', oc.contactoDycNombre ?? 'Ruben Soplapuco Garcia'], ['Área', oc.contactoDycArea ?? 'ADMINISTRACIÓN'], ['Celular', oc.contactoDycCelular ?? '979228332'], ['Teléfono D&C', oc.contactoDycTelefono ?? '074-238554']])] })] }),
      ...(oc.nota ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: cellBorders, children: [title('Notas'), para(oc.nota, { size: 16 })] })] })] })] : []),
      para('Nos reservamos el derecho de devolver la mercadería que no esté de acuerdo con nuestras especificaciones.', { size: 15, color: C.gray, after: 160 }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: noBorders, children: [new Paragraph({ children: [new ImageRun({ data: firmaAdmin, transformation: { width: 140, height: 60 }, type: 'jpg' })], alignment: AlignmentType.CENTER }), para('________________________', { align: 'center', size: 15 }), para('Jefe de Administración', { bold: true, size: 17, color: C.navy, align: 'center' })] }), new TableCell({ borders: noBorders, children: [new Paragraph({ children: [new ImageRun({ data: firmaLogistica, transformation: { width: 140, height: 60 }, type: 'jpg' })], alignment: AlignmentType.CENTER }), para('________________________', { align: 'center', size: 15 }), para('Logística', { bold: true, size: 17, color: C.navy, align: 'center' })] })] })] }),
    ],
  }] })
  return Packer.toBuffer(doc)
}
