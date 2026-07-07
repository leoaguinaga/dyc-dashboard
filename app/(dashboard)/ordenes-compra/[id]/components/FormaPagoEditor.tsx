'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Pencil, Check, X, Info } from 'lucide-react'
import type { OrdenCompra } from '@/types/api'

const DETRACCION_REFERENCIA = [
  { codigo: '030', concepto: 'Contratos de construcción', pct: '4%' },
  { codigo: '019', concepto: 'Arrendamiento de bienes (maquinaria/equipo)', pct: '10%' },
  { codigo: '012', concepto: 'Intermediación laboral y tercerización', pct: '12%' },
  { codigo: '022', concepto: 'Otros servicios empresariales', pct: '12%' },
  { codigo: '027', concepto: 'Transporte de carga', pct: '4%' },
]

interface Props {
  ocId: string
  oc: Pick<
    OrdenCompra,
    | 'adelantoPorcentaje'
    | 'saldoPorcentaje'
    | 'detraccionPorcentaje'
    | 'tipoCambio'
    | 'contactoProveedorNombre'
    | 'contactoProveedorTelefono'
    | 'condicionPago'
    | 'tiempoEntrega'
    | 'contactoDycNombre'
    | 'contactoDycArea'
    | 'contactoDycCelular'
    | 'contactoDycTelefono'
  >
}

type FormState = {
  adelantoPorcentaje: string
  saldoPorcentaje: string
  detraccionPorcentaje: string
  tipoCambio: string
  contactoProveedorNombre: string
  contactoProveedorTelefono: string
  condicionPago: string
  tiempoEntrega: string
  contactoDycNombre: string
  contactoDycArea: string
  contactoDycCelular: string
  contactoDycTelefono: string
}

function toForm(oc: Props['oc']): FormState {
  return {
    adelantoPorcentaje: oc.adelantoPorcentaje ?? '',
    saldoPorcentaje: oc.saldoPorcentaje ?? '',
    detraccionPorcentaje: oc.detraccionPorcentaje ?? '',
    tipoCambio: oc.tipoCambio ?? '',
    contactoProveedorNombre: oc.contactoProveedorNombre ?? '',
    contactoProveedorTelefono: oc.contactoProveedorTelefono ?? '',
    condicionPago: oc.condicionPago ?? '',
    tiempoEntrega: oc.tiempoEntrega ?? '',
    contactoDycNombre: oc.contactoDycNombre ?? '',
    contactoDycArea: oc.contactoDycArea ?? '',
    contactoDycCelular: oc.contactoDycCelular ?? '',
    contactoDycTelefono: oc.contactoDycTelefono ?? '',
  }
}

const labelCn = 'mb-1 block text-xs text-muted-foreground'

export function FormaPagoEditor({ ocId, oc }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>(toForm(oc))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const role = session?.user?.role
  const canEdit = role === 'administrador' || role === 'logistica'

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await api.patch(`/ordenes-compra/${ocId}`, {
        adelantoPorcentaje: form.adelantoPorcentaje !== '' ? Number(form.adelantoPorcentaje) : null,
        saldoPorcentaje: form.saldoPorcentaje !== '' ? Number(form.saldoPorcentaje) : null,
        detraccionPorcentaje: form.detraccionPorcentaje !== '' ? Number(form.detraccionPorcentaje) : null,
        tipoCambio: form.tipoCambio !== '' ? Number(form.tipoCambio) : null,
        contactoProveedorNombre: form.contactoProveedorNombre.trim() || null,
        contactoProveedorTelefono: form.contactoProveedorTelefono.trim() || null,
        condicionPago: form.condicionPago.trim() || null,
        tiempoEntrega: form.tiempoEntrega.trim() || null,
        contactoDycNombre: form.contactoDycNombre.trim() || null,
        contactoDycArea: form.contactoDycArea.trim() || null,
        contactoDycCelular: form.contactoDycCelular.trim() || null,
        contactoDycTelefono: form.contactoDycTelefono.trim() || null,
      })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setForm(toForm(oc))
    setEditing(false)
    setErr(null)
  }

  if (!editing) {
    const hasData =
      oc.adelantoPorcentaje || oc.saldoPorcentaje || oc.detraccionPorcentaje ||
      oc.tipoCambio || oc.contactoProveedorNombre || oc.contactoProveedorTelefono || oc.condicionPago ||
      oc.tiempoEntrega || oc.contactoDycNombre || oc.contactoDycArea || oc.contactoDycCelular || oc.contactoDycTelefono

    return (
      <div className="flex items-start justify-between gap-2 group">
        {hasData ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm flex-1">
            {oc.condicionPago && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Condición de pago</dt>
                <dd className="font-medium">{oc.condicionPago}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">Adelanto / Saldo</dt>
              <dd className="font-medium">
                {oc.adelantoPorcentaje ? `${oc.adelantoPorcentaje}%` : '—'} / {oc.saldoPorcentaje ? `${oc.saldoPorcentaje}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Detracción</dt>
              <dd className="font-medium">{oc.detraccionPorcentaje ? `${oc.detraccionPorcentaje}%` : '—'}</dd>
            </div>
            {oc.tipoCambio && (
              <div>
                <dt className="text-xs text-muted-foreground">Tipo de cambio</dt>
                <dd className="font-medium">{oc.tipoCambio}</dd>
              </div>
            )}
            {oc.tiempoEntrega && (
              <div>
                <dt className="text-xs text-muted-foreground">Tiempo de entrega</dt>
                <dd className="font-medium">{oc.tiempoEntrega}</dd>
              </div>
            )}
            {(oc.contactoProveedorNombre || oc.contactoProveedorTelefono) && (
              <div>
                <dt className="text-xs text-muted-foreground">Contacto proveedor</dt>
                <dd className="font-medium">
                  {oc.contactoProveedorNombre}
                  {oc.contactoProveedorTelefono && ` · ${oc.contactoProveedorTelefono}`}
                </dd>
              </div>
            )}
            {(oc.contactoDycNombre || oc.contactoDycArea || oc.contactoDycCelular || oc.contactoDycTelefono) && (
              <div>
                <dt className="text-xs text-muted-foreground">Contacto D&amp;C</dt>
                <dd className="font-medium">
                  {oc.contactoDycNombre}
                  {oc.contactoDycArea && ` · ${oc.contactoDycArea}`}
                  {(oc.contactoDycCelular || oc.contactoDycTelefono) &&
                    ` · ${[oc.contactoDycCelular, oc.contactoDycTelefono].filter(Boolean).join(' / ')}`}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <span className="text-sm text-muted-foreground italic">Sin definir</span>
        )}
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCn}>Condición de pago</label>
        <Input
          value={form.condicionPago}
          onChange={(e) => set('condicionPago', e.target.value)}
          placeholder="Ej. 50% adelanto, 50% contra entrega"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCn}>Adelanto (%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.adelantoPorcentaje}
            onChange={(e) => set('adelantoPorcentaje', e.target.value)}
            placeholder="50"
          />
        </div>
        <div>
          <label className={labelCn}>Saldo (%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.saldoPorcentaje}
            onChange={(e) => set('saldoPorcentaje', e.target.value)}
            placeholder="50"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1">
            <label className="text-xs text-muted-foreground">Detracción (%)</label>
            <Popover>
              <PopoverTrigger className="text-muted-foreground hover:text-foreground">
                <Info className="size-3" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-xs font-medium text-foreground">Referencia SUNAT (SPOT) para construcción</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left font-normal">Cód.</th>
                      <th className="text-left font-normal">Concepto</th>
                      <th className="text-right font-normal">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DETRACCION_REFERENCIA.map((row) => (
                      <tr key={row.codigo} className="border-t border-border/50">
                        <td className="py-1 pr-1 text-muted-foreground">{row.codigo}</td>
                        <td className="py-1 pr-1">{row.concepto}</td>
                        <td className="py-1 text-right font-medium">{row.pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-muted-foreground">
                  Aplica a operaciones mayores a S/ 700 (transporte: S/ 400). Verificar código exacto según R.S. 183-2004/SUNAT.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.detraccionPorcentaje}
            onChange={(e) => set('detraccionPorcentaje', e.target.value)}
            placeholder="10"
          />
        </div>
        <div>
          <label className={labelCn}>Tipo de cambio</label>
          <Input
            type="number"
            step="0.0001"
            value={form.tipoCambio}
            onChange={(e) => set('tipoCambio', e.target.value)}
            placeholder="3.75"
          />
        </div>
        <div>
          <label className={labelCn}>Contacto proveedor</label>
          <Input
            value={form.contactoProveedorNombre}
            onChange={(e) => set('contactoProveedorNombre', e.target.value)}
            placeholder="Nombre"
          />
        </div>
        <div>
          <label className={labelCn}>Teléfono proveedor</label>
          <Input
            value={form.contactoProveedorTelefono}
            onChange={(e) => set('contactoProveedorTelefono', e.target.value)}
            placeholder="999 999 999"
          />
        </div>
        <div>
          <label className={labelCn}>Tiempo de entrega</label>
          <Input
            value={form.tiempoEntrega}
            onChange={(e) => set('tiempoEntrega', e.target.value)}
            placeholder="Ej. 15 días útiles"
          />
        </div>
      </div>
      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Contacto interno D&amp;C</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCn}>Nombre</label>
            <Input
              value={form.contactoDycNombre}
              onChange={(e) => set('contactoDycNombre', e.target.value)}
              placeholder="Nombre"
            />
          </div>
          <div>
            <label className={labelCn}>Área</label>
            <Input
              value={form.contactoDycArea}
              onChange={(e) => set('contactoDycArea', e.target.value)}
              placeholder="Ej. Administración"
            />
          </div>
          <div>
            <label className={labelCn}>Celular</label>
            <Input
              value={form.contactoDycCelular}
              onChange={(e) => set('contactoDycCelular', e.target.value)}
              placeholder="999 999 999"
            />
          </div>
          <div>
            <label className={labelCn}>Teléfono</label>
            <Input
              value={form.contactoDycTelefono}
              onChange={(e) => set('contactoDycTelefono', e.target.value)}
              placeholder="074-238554"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="sm" onClick={save} disabled={saving} className="h-7 px-3 text-xs gap-1">
          <Check className="size-3" />
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={saving} className="h-7 px-2 text-xs gap-1">
          <X className="size-3" />
          Cancelar
        </Button>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
    </div>
  )
}
