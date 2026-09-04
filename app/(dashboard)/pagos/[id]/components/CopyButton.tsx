'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 text-xs font-mono rounded border border-border bg-background px-2 py-0.5 text-foreground hover:bg-muted/40 transition-colors"
      title={`Copiar ${label || text}`}
    >
      <span>{label || text}</span>
      {copied ? (
        <Check className="size-3 text-emerald-600" />
      ) : (
        <Copy className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
      )}
    </button>
  )
}
