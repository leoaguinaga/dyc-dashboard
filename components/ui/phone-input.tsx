'use client'

import { useRef } from 'react'
import { Input } from './input'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.match(/.{1,3}/g)?.join(' ') ?? ''
}

type Props = Omit<React.ComponentProps<'input'>, 'type'>

export function PhoneInput({ value, onChange, ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const cursor = e.target.selectionStart ?? raw.length

    // Count digits before cursor to restore position after formatting
    const digitsBeforeCursor = raw.slice(0, cursor).replace(/\D/g, '').length

    const formatted = formatPhone(raw)

    // Find where to place the cursor in the formatted string
    let digitCount = 0
    let newCursor = formatted.length
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++
        if (digitCount === digitsBeforeCursor) {
          newCursor = i + 1
          break
        }
      }
    }

    // Mutate e.target.value before calling onChange so the parent receives the formatted string
    e.target.value = formatted
    onChange?.(e)

    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(newCursor, newCursor)
    })
  }

  // Ensure value coming from parent (e.g. DB) is always displayed formatted
  const displayValue = typeof value === 'string' ? formatPhone(value) : value

  return (
    <Input
      ref={ref as React.Ref<HTMLInputElement>}
      type="tel"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className="font-mono"
      {...props}
    />
  )
}
