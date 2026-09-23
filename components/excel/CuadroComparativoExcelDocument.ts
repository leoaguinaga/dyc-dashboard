import { Workbook, type Worksheet } from 'exceljs'
import type { SolicitudCotizacion, Cotizacion, CotizacionItem } from '@/types/api'

const COLORS = {
  navy: '1A3557',
  blue: '2563A8',
  gray: '6B7280',
  light: 'F3F4F6',
  border: 'D1D5DB',
  text: '111827',
  white: 'FFFFFF',
  green: '15803D',
  greenBg: 'DCFCE7',
}

const MONEY_2 = '"S/" #,##0.00'
const MONEY_4 = '"S/" #,##0.0000'
const IGV_RATE = 0.18

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

function mergeValue(sheet: Worksheet, range: string, value: unknown) {
  sheet.mergeCells(range)
  const cell = sheet.getCell(range.split(':')[0])
  cell.value = value == null || value === '' ? '—' : String(value)
  cell.alignment = { vertical: 'middle', wrapText: true }
  return cell
}

export async function renderCuadroComparativoExcel(solicitud: SolicitudCotizacion) {
  const workbook = new Workbook()
  workbook.creator = 'DYC ERP'
  workbook.created = new Date()

  const received = solicitud.cotizaciones.filter((c) => c.items.length > 0)
  const colCount = 2 + received.length

  const sheet = workbook.addWorksheet('Cuadro comparativo', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 },
    },
  })

  sheet.columns = [
    { key: 'descripcion', width: 40 },
    { key: 'cantidad', width: 16 },
    ...received.map(() => ({ width: 22 })),
  ]

  const titleCell = mergeValue(sheet, `A2:${String.fromCharCode(64 + colCount)}2`, 'CUADRO COMPARATIVO DE COTIZACIONES')
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: COLORS.navy } }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' }

  const subTitleCell = mergeValue(sheet, `A3:${String.fromCharCode(64 + colCount)}3`, solicitud.codigo)
  subTitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.blue } }

  const projectLabel = solicitud.proyecto
    ? `${solicitud.proyecto.codigo ? `${solicitud.proyecto.codigo} - ` : ''}${solicitud.proyecto.nombre}`
    : '—'
  const infoCell = mergeValue(sheet, `A4:${String.fromCharCode(64 + colCount)}4`, `Proyecto: ${projectLabel}`)
  infoCell.font = { name: 'Arial', size: 9, color: { argb: COLORS.gray } }

  sheet.getRow(5).height = 6

  const headerRow = 6
  const headers = ['Ítem', 'Cantidad', ...received.map((c) => c.proveedor.razonSocial)]
  sheet.getRow(headerRow).values = headers
  sheet.getRow(headerRow).height = 24
  sheet.getRow(headerRow).eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = thinBorder
  })

  function getCotItem(cot: Cotizacion, siId: string): CotizacionItem | undefined {
    return cot.items.find((i) => i.solicitudItemId === siId)
  }

  function getLowest(siId: string): number {
    const prices = received
      .map((c) => getCotItem(c, siId))
      .filter((i): i is CotizacionItem => Boolean(i))
      .map((i) => parseFloat(i.precioUnit))
    return prices.length ? Math.min(...prices) : Infinity
  }

  solicitud.items.forEach((si, index) => {
    const rowNumber = headerRow + 1 + index
    const row = sheet.getRow(rowNumber)
    const lowest = getLowest(si.id)
    row.getCell(1).value = si.descripcion
    row.getCell(2).value = `${number(si.cantidadCompra)} ${si.unidad}`
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }

    received.forEach((cot, colIndex) => {
      const cell = row.getCell(3 + colIndex)
      const ci = getCotItem(cot, si.id)
      if (!ci) {
        cell.value = '—'
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        return
      }
      const unitPrice = parseFloat(ci.precioUnit)
      const total = unitPrice * parseFloat(ci.cantidad)
      const isSelected = ci.seleccionado
      const isLowest = unitPrice === lowest
      cell.value = `${unitPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}/u\n${total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      if (isSelected) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.greenBg } }
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.green } }
      } else if (isLowest) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.text } }
      } else {
        cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
      }
    })

    row.height = 28
    row.eachCell((cell, column) => {
      cell.border = thinBorder
      if (column === 1) {
        cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
      }
      if (index % 2 !== 0 && column <= 2) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } }
      }
    })
  })

  const totalsStart = headerRow + solicitud.items.length + 1

  function subtotalFor(cot: Cotizacion) {
    return cot.items.reduce((sum, ci) => sum + parseFloat(ci.precioUnit) * parseFloat(ci.cantidad), 0)
  }

  const totalRow = sheet.getRow(totalsStart)
  totalRow.getCell(1).value = 'Total cotizado'
  sheet.mergeCells(`A${totalsStart}:B${totalsStart}`)
  received.forEach((cot, colIndex) => {
    const cell = totalRow.getCell(3 + colIndex)
    cell.value = round2(subtotalFor(cot))
    cell.numFmt = MONEY_2
  })
  totalRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.text } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder
  })
  totalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

  const igvRow = sheet.getRow(totalsStart + 1)
  igvRow.getCell(1).value = 'IGV (18%)'
  sheet.mergeCells(`A${totalsStart + 1}:B${totalsStart + 1}`)
  received.forEach((cot, colIndex) => {
    const cell = igvRow.getCell(3 + colIndex)
    const subtotal = subtotalFor(cot)
    cell.value = cot.incluyeIgv ? 0 : round2(subtotal * IGV_RATE)
    cell.numFmt = MONEY_2
    if (cot.incluyeIgv) cell.value = 'IGV incluido'
  })
  igvRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 8, color: { argb: COLORS.gray } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder
  })
  igvRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

  const grandTotalRow = sheet.getRow(totalsStart + 2)
  grandTotalRow.getCell(1).value = 'Total con IGV'
  sheet.mergeCells(`A${totalsStart + 2}:B${totalsStart + 2}`)
  received.forEach((cot, colIndex) => {
    const cell = grandTotalRow.getCell(3 + colIndex)
    const subtotal = subtotalFor(cot)
    cell.value = round2(cot.incluyeIgv ? subtotal : subtotal * (1 + IGV_RATE))
    cell.numFmt = MONEY_2
  })
  grandTotalRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder
  })
  grandTotalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

  // Resumen de adjudicación
  let lastRow = totalsStart + 4
  const summary = new Map<string, { nombre: string; subtotal: number }>()
  for (const cot of received) {
    for (const ci of cot.items) {
      if (!ci.seleccionado) continue
      if (!summary.has(cot.proveedorId)) {
        summary.set(cot.proveedorId, { nombre: cot.proveedor.razonSocial, subtotal: 0 })
      }
      const entry = summary.get(cot.proveedorId)!
      entry.subtotal += parseFloat(ci.precioUnit) * parseFloat(ci.cantidad)
    }
  }

  if (summary.size > 0) {
    const summaryTitle = mergeValue(sheet, `A${lastRow}:${String.fromCharCode(64 + colCount)}${lastRow}`, 'ADJUDICACIÓN')
    summaryTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.navy } }
    lastRow += 1
    for (const [, entry] of summary) {
      const row = sheet.getRow(lastRow)
      row.getCell(1).value = entry.nombre
      row.getCell(2).value = round2(entry.subtotal)
      row.getCell(2).numFmt = MONEY_2
      row.getCell(1).font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }
      row.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.text } }
      lastRow += 1
    }
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (!cell.font?.name) cell.font = { ...cell.font, name: 'Arial' }
    })
  })
  sheet.pageSetup.printArea = `A1:${String.fromCharCode(64 + colCount)}${lastRow}`
  sheet.headerFooter.oddFooter = `Generado por DYC ERP - ${new Date().toLocaleDateString('es-PE')}                              ${solicitud.codigo}`

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
