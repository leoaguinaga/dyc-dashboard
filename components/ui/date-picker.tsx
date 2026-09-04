"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Seleccionar fecha",
  min,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const date = value ? parseISO(value) : undefined;

  function handleSelect(selected: Date | undefined) {
    onValueChange?.(selected ? format(selected, "yyyy-MM-dd") : "");
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          ariaInvalid && "border-destructive ring-3 ring-destructive/20",
          !date && "text-muted-foreground",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {date
            ? format(date, "d 'de' MMMM, yyyy", { locale: es })
            : placeholder}
        </span>
        <CalendarIcon className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={es}
          captionLayout="dropdown"
          disabled={min ? { before: parseISO(min) } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
