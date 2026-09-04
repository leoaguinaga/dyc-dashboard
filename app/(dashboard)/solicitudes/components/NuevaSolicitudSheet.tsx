"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ClipboardList, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Props {
  puedeCrearPrecotizado: boolean;
  defaultOpen?: boolean;
  triggerLabel?: string;
}

const optionClassName =
  "group flex min-h-44 flex-col rounded-xl border border-border bg-background p-5 text-left transition-[border-color,background-color] duration-[150ms] hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 motion-reduce:transition-none";

export function NuevaSolicitudSheet({
  puedeCrearPrecotizado,
  defaultOpen = false,
  triggerLabel = "Nueva solicitud",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && defaultOpen) {
      router.replace("/solicitudes", { scroll: false });
    }
  }

  return (
    <Sheet open={open || defaultOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button />}>
        <Plus className="size-4" />
        {triggerLabel}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 motion-reduce:transition-none sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-5 pr-14">
          <SheetTitle className="text-lg font-semibold">
            ¿Qué necesitas solicitar?
          </SheetTitle>
          <SheetDescription className="mt-1 leading-5">
            Elige el camino que refleja cómo se realizará la compra. La
            información seguirá su flujo operativo habitual.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-6">
          <Link href="/requerimientos/nuevo" className={optionClassName}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform duration-[150ms] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
            </div>
            <h2 className="mt-5 text-base font-semibold">
              Macro requerimiento
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Logística solicitará cotizaciones, comparará proveedores y
              gestionará la adjudicación.
            </p>
            <p className="mt-auto pt-4 text-xs font-medium text-foreground">
              Ideal si aún no tienes proveedor ni precio definidos.
            </p>
          </Link>

          {puedeCrearPrecotizado ? (
            <Link href="/compras-simples/nueva" className={optionClassName}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShoppingBag className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform duration-[150ms] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
              </div>
              <h2 className="mt-5 text-base font-semibold">
                Requerimiento precotizado
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Registra una compra con proveedor y precios definidos,
                incluyendo rendición cuando corresponda.
              </p>
              <p className="mt-auto pt-4 text-xs font-medium text-foreground">
                Ideal para compras resueltas en campo.
              </p>
            </Link>
          ) : (
            <div className="flex min-h-44 flex-col rounded-xl border border-dashed border-border p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ShoppingBag className="size-5" />
              </div>
              <h2 className="mt-5 text-base font-semibold">
                Requerimiento precotizado
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Tu rol no puede registrar compras precotizadas. Usa un macro
                requerimiento para solicitar la compra.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
