'use client'

import { useState } from 'react'
import { ChevronDown, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SolicitudItemsEditor } from './SolicitudItemsEditor'
import type { EstadoSolicitud, Role, SolicitudItem } from '@/types/api'

interface Props {
  solicitudId: string
  estado: EstadoSolicitud
  items: SolicitudItem[]
  nota?: string | null
  role?: Role
}

export function MaterialesSolicitadosCard({
  solicitudId,
  estado,
  items,
  nota,
  role,
}: Props) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-2 h-fit">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left group cursor-pointer select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <h2 className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Materiales solicitados ({items.length})
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          <span>{isOpen ? 'Ocultar' : 'Mostrar'}</span>
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200',
              isOpen ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-1">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ítems registrados</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const total = parseFloat(item.cantidadTotal)
                const almacen = parseFloat(item.cantidadAlmacen)
                const compra = parseFloat(item.cantidadCompra)
                return (
                  <div key={item.id} className="space-y-1">
                    <p className="text-sm font-medium">{item.descripcion}</p>
                    {item.item?.codigo && (
                      <p className="text-xs text-muted-foreground font-mono">{item.item.codigo}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        Total: <strong className="text-foreground">{total} {item.unidad}</strong>
                      </span>
                      {almacen > 0 && (
                        <span className="tabular-nums text-chart-2">Almacén: {almacen}</span>
                      )}
                      <span className="tabular-nums">
                        Comprar: <strong>{compra} {item.unidad}</strong>
                      </span>
                    </div>
                    {/* Barra visual */}
                    {total > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-chart-2"
                          style={{ width: `${Math.min((almacen / total) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {nota && (
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground italic">&ldquo;{nota}&rdquo;</p>
            </div>
          )}

          <SolicitudItemsEditor
            solicitudId={solicitudId}
            estado={estado}
            items={items}
            nota={nota}
            role={role}
          />
        </div>
      )}
    </div>
  )
}
