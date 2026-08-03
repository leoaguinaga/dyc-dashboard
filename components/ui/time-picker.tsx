"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimePickerProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  "aria-invalid"?: boolean
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

export function TimePicker({
  value,
  onValueChange,
  placeholder = "Seleccionar hora",
  className,
  disabled,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hora, minuto] = value ? value.split(":") : [undefined, undefined]
  const horaRef = React.useRef<HTMLButtonElement>(null)
  const minutoRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return
    // Base UI's Popover mounts/positions the portal a frame or two after
    // `open` flips true, so the refs aren't attached yet on the same tick —
    // a plain rAF or setTimeout(0) fires too early. 60ms clears that.
    const timer = setTimeout(() => {
      horaRef.current?.scrollIntoView({ block: "center" })
      minutoRef.current?.scrollIntoView({ block: "center" })
    }, 60)
    return () => clearTimeout(timer)
  }, [open])

  function setHora(h: string) {
    onValueChange?.(`${h}:${minuto ?? "00"}`)
  }

  function setMinuto(m: string) {
    onValueChange?.(`${hora ?? "00"}:${m}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          ariaInvalid && "border-destructive ring-3 ring-destructive/20",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <span className="tabular-nums">{value || placeholder}</span>
        <ClockIcon className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex divide-x divide-border">
          <div className="max-h-48 w-16 overflow-y-auto p-1">
            {HORAS.map((h) => (
              <button
                key={h}
                ref={h === (hora ?? "00") ? horaRef : undefined}
                type="button"
                onClick={() => setHora(h)}
                className={cn(
                  "w-full cursor-pointer rounded-md px-2 py-1.5 text-center text-sm tabular-nums outline-none transition-colors duration-[80ms] hover:bg-accent hover:text-accent-foreground",
                  hora === h && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="max-h-48 w-16 overflow-y-auto p-1">
            {MINUTOS.map((m) => (
              <button
                key={m}
                ref={m === (minuto ?? "00") ? minutoRef : undefined}
                type="button"
                onClick={() => setMinuto(m)}
                className={cn(
                  "w-full cursor-pointer rounded-md px-2 py-1.5 text-center text-sm tabular-nums outline-none transition-colors duration-[80ms] hover:bg-accent hover:text-accent-foreground",
                  minuto === m && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
