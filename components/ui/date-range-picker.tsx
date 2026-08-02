"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRangeValue {
  desde?: string
  hasta?: string
}

interface DateRangePickerProps {
  value?: DateRangeValue
  onValueChange?: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Seleccionar rango",
  className,
}: DateRangePickerProps) {
  const range: DateRange | undefined = value?.desde || value?.hasta
    ? { from: value.desde ? parseISO(value.desde) : undefined, to: value.hasta ? parseISO(value.hasta) : undefined }
    : undefined

  function handleSelect(selected: DateRange | undefined) {
    onValueChange?.({
      desde: selected?.from ? format(selected.from, "yyyy-MM-dd") : undefined,
      hasta: selected?.to ? format(selected.to, "yyyy-MM-dd") : undefined,
    })
  }

  function label() {
    if (!range?.from) return placeholder
    if (!range.to) return format(range.from, "d MMM yyyy", { locale: es })
    return `${format(range.from, "d MMM yyyy", { locale: es })} — ${format(range.to, "d MMM yyyy", { locale: es })}`
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          !range?.from && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{label()}</span>
        <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={handleSelect}
          locale={es}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
