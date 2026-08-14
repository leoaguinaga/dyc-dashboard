import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { API_ORIGIN } from '@/lib/api/client'
import type { Pago } from '@/types/api'
import { cn, formatCurrency, formatDateOnly, formatPercent } from '@/lib/utils'
import { MarcarPagadoCard } from './components/MarcarPagadoCard'

const ESTADO_LABEL: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  pagado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

interface Props {
  params: Promise<{ id: string }>
}

function DatoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}

export default async function PagoDetailPage({ params }: Props) {
  const { id } = await params
  const pago = await serverFetch<Pago>(`/pagos/${id}`).catch(() => null)
  if (!pago) notFound()

  const beneficiario = pago.tipoBeneficiario === 'trabajador'
    ? (pago.beneficiarioTrabajador?.nombre ?? pago.ordenCompra.creadoPor.name)
    : (pago.ordenCompra.proveedor?.razonSocial ?? pago.ordenCompra.proveedorNombreLibre ?? 'Sin proveedor')

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="space-y-1">
        <Link href="/pagos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-120">
          <ArrowLeft className="size-3.5" />
          Pagos
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">
            Pago de{' '}
            <Link href={`/ordenes-compra/${pago.ordenCompraId}`} className="font-mono hover:text-primary transition-colors duration-120">
              {pago.ordenCompra.numero}
            </Link>
          </h1>
          <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[pago.estadoEfectivo])}>
            {ESTADO_LABEL[pago.estadoEfectivo]}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 grid gap-4 sm:grid-cols-2">
        <DatoCard label="Proyecto" value={
          <Link href={`/proyectos/${pago.ordenCompra.proyecto.id}`} className="hover:text-primary transition-colors duration-120">
            {pago.ordenCompra.proyecto.codigo ?? pago.ordenCompra.proyecto.nombre}
          </Link>
        } />
        <DatoCard label="Beneficiario" value={beneficiario} />
        <DatoCard label="Monto" value={formatCurrency(pago.monto)} />
        <DatoCard label="Porcentaje del total" value={formatPercent(pago.porcentaje)} />
        <DatoCard label="Fecha programada" value={formatDateOnly(pago.fechaProgramada)} />
        {pago.fechaPagoReal && <DatoCard label="Fecha de pago" value={formatDateOnly(pago.fechaPagoReal)} />}
        {pago.metodoPago && <DatoCard label="Método de pago" value={pago.metodoPago} />}
        {pago.numeroOperacion && <DatoCard label="N° de operación" value={pago.numeroOperacion} />}
        {pago.nota && <DatoCard label="Nota" value={pago.nota} />}
        <DatoCard label="Registrado por" value={pago.registradoPor.name} />
        {pago.pagadoPor && <DatoCard label="Pagado por" value={pago.pagadoPor.name} />}
      </div>

      {pago.comprobanteUrl && (
        <div className="rounded-xl border border-border bg-white p-5 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Factura / boleta</h2>
          {pago.comprobanteUrl.endsWith('.pdf') ? (
            <a
              href={`${API_ORIGIN}${pago.comprobanteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {pago.comprobanteNombre ?? 'Ver comprobante (PDF)'}
            </a>
          ) : (
            <a href={`${API_ORIGIN}${pago.comprobanteUrl}`} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_ORIGIN}${pago.comprobanteUrl}`}
                alt="Comprobante de pago"
                className="w-full max-w-sm rounded-lg border border-border"
              />
            </a>
          )}
        </div>
      )}

      {pago.estado === 'pendiente' && <MarcarPagadoCard pago={pago} />}
    </div>
  )
}
