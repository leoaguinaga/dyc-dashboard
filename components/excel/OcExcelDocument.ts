import path from 'node:path'
import { Workbook, type Worksheet } from 'exceljs'
import type { OrdenCompra } from '@/types/api'
import { numeroALetras } from '@/lib/numero-a-letras'

const COLORS = {
  navy: '1A3557',
  blue: '2563A8',
  gray: '6B7280',
  light: 'F3F4F6',
  border: 'D1D5DB',
  text: '111827',
  white: 'FFFFFF',
}

const EMPRESA = {
  razonSocial: 'DIAZ & CASTILLO INGENIERÍA Y PROYECTOS SAC',
  ruc: '20608745611',
  direccion: 'Av. Francisco Bolognesi 342 Int. B, Chiclayo, Chiclayo, Lambayeque',
  tagline: 'Ejecutando obras con estándares de salud, seguridad, calidad y protección medio ambiente',
}

const MONEY_2 = '"S/" #,##0.00'
const MONEY_4 = '"S/" #,##0.0000'
const thinBorder = {
  top: { style: 'thin' as const, color: { argb: COLORS.border } },
  left: { style: 'thin' as const, color: { argb: COLORS.border } },
  bottom: { style: 'thin' as const, color: { argb: COLORS.border } },
  right: { style: 'thin' as const, color: { argb: COLORS.border } },
}

function number(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Por coordinar'
}

function mergeValue(sheet: Worksheet, range: string, value: unknown) {
  sheet.mergeCells(range)
  const cell = sheet.getCell(range.split(':')[0])
  cell.value = value == null || value === '' ? '—' : String(value)
  cell.alignment = { vertical: 'middle', wrapText: true }
  return cell
}

function sectionTitle(sheet: Worksheet, row: number, start: string, end: string, title: string) {
  const cell = mergeValue(sheet, `${start}${row}:${end}${row}`, title.toUpperCase())
  cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.blue } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EAF2FB' } }
  cell.border = thinBorder
}

function infoLine(
  sheet: Worksheet,
  row: number,
  labelColumn: string,
  valueStart: string,
  valueEnd: string,
  label: string,
  value: unknown,
) {
  const labelCell = sheet.getCell(`${labelColumn}${row}`)
  labelCell.value = label
  labelCell.font = { name: 'Arial', size: 9, color: { argb: COLORS.gray } }
  labelCell.alignment = { vertical: 'top' }
  const valueCell = mergeValue(sheet, `${valueStart}${row}:${valueEnd}${row}`, value)
  valueCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.text } }
}

function styleSectionBox(sheet: Worksheet, range: string) {
  const [start, end] = range.split(':')
  const startCell = sheet.getCell(start)
  const endCell = sheet.getCell(end)
  for (let row = startCell.row; row <= endCell.row; row += 1) {
    for (let col = startCell.col; col <= endCell.col; col += 1) {
      sheet.getCell(row, col).border = thinBorder
    }
  }
}

export async function renderOcExcel(oc: OrdenCompra) {
  const workbook = new Workbook()
  workbook.creator = 'DYC ERP'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(oc.tipo === 'servicio' ? 'Orden de servicio' : 'Orden de compra', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 },
    },
  })

  sheet.columns = [
    { key: 'codigo', width: 12 },
    { key: 'cantidad', width: 13 },
    { key: 'unidad', width: 16 },
    { key: 'descripcion', width: 48 },
    { key: 'precioUnitario', width: 19 },
    { key: 'precioTotal', width: 19 },
  ]

  const docLabel = oc.tipo === 'servicio' ? 'ORDEN DE SERVICIO' : 'ORDEN DE COMPRA'
  const proveedor = oc.proveedor
  const contacto = oc.contactoProveedorNombre ?? proveedor?.contactos?.[0]?.nombre ?? '—'
  const telefono = oc.contactoProveedorTelefono ?? proveedor?.contactos?.[0]?.telefono ?? '—'

  mergeValue(sheet, 'A2:D3', EMPRESA.razonSocial).font = {
    name: 'Arial', size: 16, bold: true, color: { argb: COLORS.navy },
  }
  mergeValue(sheet, 'A4:D4', EMPRESA.tagline).font = {
    name: 'Arial', size: 8, color: { argb: COLORS.gray },
  }
  const title = mergeValue(sheet, 'E2:F2', docLabel)
  title.font = { name: 'Arial', size: 14, bold: true, color: { argb: COLORS.blue } }
  title.alignment = { horizontal: 'right', vertical: 'middle' }
  const subTitle = mergeValue(sheet, 'E3:F3', 'GUÍA DE INTERNAMIENTO')
  subTitle.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.gray } }
  subTitle.alignment = { horizontal: 'right', vertical: 'middle' }
  const numberCell = mergeValue(sheet, 'E4:F4', `N° ${oc.numero}`)
  numberCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: COLORS.navy } }
  numberCell.alignment = { horizontal: 'right', vertical: 'middle' }
  const nameCell = mergeValue(sheet, 'E5:F5', oc.nombre ?? '')
  nameCell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
  nameCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true }
  const dateCell = mergeValue(
    sheet,
    'E6:F6',
    oc.fechaEmision ? `Emitida: ${formatDate(oc.fechaEmision)}` : `Creada: ${formatDate(oc.creadoEn)}`,
  )
  dateCell.font = { name: 'Arial', size: 8, color: { argb: COLORS.gray } }
  dateCell.alignment = { horizontal: 'right', vertical: 'middle' }
  sheet.getRow(7).height = 6
  sheet.getCell('A7').border = { bottom: { style: 'medium', color: { argb: COLORS.navy } } }
  sheet.mergeCells('A7:F7')

  sectionTitle(sheet, 9, 'A', 'C', 'Señores')
  sectionTitle(sheet, 9, 'D', 'F', 'Facturar a nombre de')
  const leftInfo: Array<[string, unknown]> = [
    ['Razón social', proveedor?.razonSocial ?? oc.proveedorNombreLibre],
    ['RUC', proveedor?.ruc],
    ['Dirección', proveedor?.direccion],
    ['Enviar a', oc.lugarEntrega],
    ['Lo siguiente', oc.concepto],
    ['Obra', `${oc.proyecto.codigo ? `${oc.proyecto.codigo} - ` : ''}${oc.proyecto.nombre}`],
    ['Referencia', oc.referencia],
  ]
  const rightInfo: Array<[string, unknown]> = [
    ['Razón social', EMPRESA.razonSocial],
    ['RUC', EMPRESA.ruc],
    ['Dirección', EMPRESA.direccion],
    ['Solicitud', oc.solicitud?.codigo],
    ['Requerimiento', oc.solicitud?.requerimiento?.codigo],
  ]
  for (let index = 0; index < 7; index += 1) {
    const row = 10 + index
    const left = leftInfo[index]
    const right = rightInfo[index]
    if (left) infoLine(sheet, row, 'A', 'B', 'C', left[0], left[1])
    if (right) infoLine(sheet, row, 'D', 'E', 'F', right[0], right[1])
  }
  sheet.getRow(12).height = 52
  sheet.getRow(15).height = 34
  styleSectionBox(sheet, 'A9:C16')
  styleSectionBox(sheet, 'D9:F16')

  const itemHeaderRow = 18
  const headers = ['Cod.', 'Cant.', 'U.D.M', 'Descripción', 'P. Unitario', 'P. Total']
  sheet.getRow(itemHeaderRow).values = headers
  sheet.getRow(itemHeaderRow).height = 24
  sheet.getRow(itemHeaderRow).eachCell((cell, column) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
    cell.alignment = { horizontal: column === 4 ? 'left' : 'center', vertical: 'middle' }
    cell.border = thinBorder
  })

  oc.items.forEach((item, index) => {
    const row = sheet.getRow(itemHeaderRow + 1 + index)
    row.values = [
      item.codigo ?? String(index + 1),
      number(item.cantidad),
      item.unidad,
      item.descripcion,
      number(item.precioUnitario),
      number(item.precioTotal),
    ]
    row.height = 22
    row.eachCell((cell, column) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
      cell.alignment = {
        horizontal: column === 4 ? 'left' : column >= 5 || column === 2 ? 'right' : 'center',
        vertical: 'middle',
        wrapText: column === 4,
      }
      cell.border = thinBorder
      if (index % 2 !== 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } }
      }
    })
    row.getCell(2).numFmt = '#,##0.####'
    row.getCell(5).numFmt = MONEY_4
    row.getCell(6).numFmt = MONEY_2
  })

  const itemsTotal = oc.items.reduce((sum, item) => sum + number(item.precioTotal), 0)
  const subtotal = round2(oc.incluyeIgv ? itemsTotal / 1.18 : itemsTotal)
  const igv = round2(oc.incluyeIgv ? itemsTotal - subtotal : itemsTotal * 0.18)
  const total = round2(oc.incluyeIgv ? itemsTotal : subtotal + igv)
  const totalsStart = itemHeaderRow + oc.items.length + 2
  const totals: Array<[string, number]> = [
    ['V. Compra (sin IGV)', subtotal],
    ['IGV (18%)', igv],
    ['TOTAL', total],
  ]
  totals.forEach(([label, value], index) => {
    const row = totalsStart + index
    sheet.mergeCells(`D${row}:E${row}`)
    const labelCell = sheet.getCell(`D${row}`)
    const valueCell = sheet.getCell(`F${row}`)
    labelCell.value = label
    valueCell.value = value
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
    valueCell.alignment = { horizontal: 'right', vertical: 'middle' }
    valueCell.numFmt = MONEY_2
    if (index === 2) {
      for (const cell of [labelCell, sheet.getCell(`E${row}`), valueCell]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.white } }
      }
    } else {
      labelCell.font = { name: 'Arial', size: 9, color: { argb: COLORS.gray } }
      valueCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.text } }
    }
  })

  const wordsRow = totalsStart + 4
  const wordsCell = mergeValue(sheet, `A${wordsRow}:F${wordsRow}`, `SON: ${numeroALetras(total, proveedor?.moneda)}`)
  wordsCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.navy } }

  const paymentTitleRow = wordsRow + 2
  sectionTitle(sheet, paymentTitleRow, 'A', 'F', 'Forma de pago')
  infoLine(sheet, paymentTitleRow + 1, 'A', 'B', 'F', 'Condición', oc.condicionPago ?? 'Por coordinar')
  const paymentHeaderRow = paymentTitleRow + 3
  sheet.getRow(paymentHeaderRow).values = ['Concepto', '', '', '%', 'Bruto', 'Neto a depositar']
  sheet.mergeCells(`A${paymentHeaderRow}:C${paymentHeaderRow}`)
  sheet.getRow(paymentHeaderRow).eachCell((cell) => {
    cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: COLORS.gray } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder
  })

  const adelantoPct = oc.adelantoPorcentaje ? number(oc.adelantoPorcentaje) : 50
  const saldoPct = oc.saldoPorcentaje ? number(oc.saldoPorcentaje) : 50
  const descuento = oc.detraccionPorcentaje
    ? number(oc.detraccionPorcentaje)
    : oc.retencionPorcentaje ? number(oc.retencionPorcentaje) : 10
  const descuentoLabel = oc.retencionPorcentaje && !oc.detraccionPorcentaje ? 'Retención' : 'Detracción'
  const paymentRows: Array<[string, number, number, number]> = [
    [`Adelanto a la emisión de la ${oc.tipo === 'servicio' ? 'OS' : 'OC'}`, adelantoPct, round2(total * adelantoPct / 100), round2(total * adelantoPct / 100 * (1 - descuento / 100))],
    ['Saldo al término de obra', saldoPct, round2(total * saldoPct / 100), round2(total * saldoPct / 100 * (1 - descuento / 100))],
  ]
  paymentRows.forEach(([concept, percentage, gross, net], index) => {
    const rowNumber = paymentHeaderRow + 1 + index
    sheet.mergeCells(`A${rowNumber}:C${rowNumber}`)
    sheet.getCell(`A${rowNumber}`).value = concept
    sheet.getCell(`D${rowNumber}`).value = percentage / 100
    sheet.getCell(`E${rowNumber}`).value = gross
    sheet.getCell(`F${rowNumber}`).value = net
    sheet.getCell(`D${rowNumber}`).numFmt = '0.0%'
    sheet.getCell(`E${rowNumber}`).numFmt = MONEY_2
    sheet.getCell(`F${rowNumber}`).numFmt = MONEY_2
    sheet.getRow(rowNumber).eachCell((cell, column) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
      cell.alignment = { horizontal: column === 1 ? 'left' : 'right', vertical: 'middle' }
      cell.border = thinBorder
    })
  })

  const financialRow = paymentHeaderRow + 4
  infoLine(sheet, financialRow, 'A', 'B', 'C', 'Tipo de cambio', number(oc.tipoCambio))
  sheet.getCell(`B${financialRow}`).value = number(oc.tipoCambio)
  sheet.getCell(`B${financialRow}`).numFmt = '#,##0.0000'
  infoLine(sheet, financialRow, 'D', 'E', 'F', descuentoLabel, descuento / 100)
  sheet.getCell(`E${financialRow}`).value = descuento / 100
  sheet.getCell(`E${financialRow}`).numFmt = '0.0%'
  const discountValueRow = financialRow + 1
  infoLine(sheet, discountValueRow, 'A', 'B', 'C', 'Descuento', round2(total * descuento / 100))
  sheet.getCell(`B${discountValueRow}`).value = round2(total * descuento / 100)
  sheet.getCell(`B${discountValueRow}`).numFmt = MONEY_2
  infoLine(sheet, discountValueRow, 'D', 'E', 'F', 'Total neto', round2(total * (1 - descuento / 100)))
  sheet.getCell(`E${discountValueRow}`).value = round2(total * (1 - descuento / 100))
  sheet.getCell(`E${discountValueRow}`).numFmt = MONEY_2

  const contactTitleRow = financialRow + 3
  sectionTitle(sheet, contactTitleRow, 'A', 'C', 'Contacto proveedor')
  sectionTitle(sheet, contactTitleRow, 'D', 'F', 'Contacto D&C')
  const providerInfo: Array<[string, unknown]> = [
    ['Contacto', contacto],
    ['Teléfono', telefono],
    ['Cta / CCI', `${proveedor?.banco ?? '—'} - ${proveedor?.numeroCuenta ?? '—'}`],
    ['Moneda', proveedor?.moneda ?? 'Soles'],
    ['Tiempo de entrega', oc.tiempoEntrega],
    ['Fecha de entrega', formatDate(oc.fechaEntrega)],
  ]
  const dycInfo: Array<[string, unknown]> = [
    ['Contacto', oc.contactoDycNombre ?? 'Ruben Soplapuco Garcia'],
    ['Área', oc.contactoDycArea ?? 'ADMINISTRACIÓN'],
    ['Celular', oc.contactoDycCelular ?? '979228332'],
    ['Teléfono D&C', oc.contactoDycTelefono ?? '074-238554'],
  ]
  for (let index = 0; index < 6; index += 1) {
    const row = contactTitleRow + 1 + index
    const left = providerInfo[index]
    const right = dycInfo[index]
    if (left) infoLine(sheet, row, 'A', 'B', 'C', left[0], left[1])
    if (right) infoLine(sheet, row, 'D', 'E', 'F', right[0], right[1])
  }
  styleSectionBox(sheet, `A${contactTitleRow}:C${contactTitleRow + 6}`)
  styleSectionBox(sheet, `D${contactTitleRow}:F${contactTitleRow + 6}`)

  let lastRow = contactTitleRow + 7
  if (oc.nota) {
    sectionTitle(sheet, lastRow + 1, 'A', 'F', 'Notas')
    const noteCell = mergeValue(sheet, `A${lastRow + 2}:F${lastRow + 3}`, oc.nota)
    noteCell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
    noteCell.border = thinBorder
    lastRow += 4
  }

  const reserveCell = mergeValue(
    sheet,
    `A${lastRow + 1}:F${lastRow + 1}`,
    'Nos reservamos el derecho de devolver la mercadería que no esté de acuerdo con nuestras especificaciones.',
  )
  reserveCell.font = { name: 'Arial', size: 8, italic: true, color: { argb: COLORS.gray } }

  const signatureRow = lastRow + 3
  const adminImage = workbook.addImage({
    filename: path.join(process.cwd(), 'public', 'signatures', 'jefe-admin.jpg'),
    extension: 'jpeg',
  })
  const logisticsImage = workbook.addImage({
    filename: path.join(process.cwd(), 'public', 'signatures', 'logistica.jpg'),
    extension: 'jpeg',
  })
  sheet.addImage(adminImage, { tl: { col: 0.8, row: signatureRow - 1 }, ext: { width: 180, height: 78 } })
  sheet.addImage(logisticsImage, { tl: { col: 4.15, row: signatureRow - 1 }, ext: { width: 180, height: 78 } })
  sheet.getRow(signatureRow).height = 62
  const adminLabel = mergeValue(sheet, `A${signatureRow + 1}:C${signatureRow + 1}`, 'Jefe de Administración')
  const logisticsLabel = mergeValue(sheet, `D${signatureRow + 1}:F${signatureRow + 1}`, 'Logística')
  for (const cell of [adminLabel, logisticsLabel]) {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.navy } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { top: { style: 'thin', color: { argb: COLORS.text } } }
  }
  lastRow = signatureRow + 1

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (!cell.font?.name) cell.font = { ...cell.font, name: 'Arial' }
    })
  })
  sheet.pageSetup.printArea = `A1:F${lastRow}`
  sheet.headerFooter.oddFooter = `Generado por DYC ERP - ${new Date().toLocaleDateString('es-PE')}                              ${oc.numero}`

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
