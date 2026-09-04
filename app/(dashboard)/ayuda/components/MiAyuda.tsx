'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, CircleHelp, Search, Sparkles } from 'lucide-react'
import type { Role } from '@/types/api'
import { GUIAS_FAQS, GUIAS_PROCESOS, type RoleInfo } from './guias-data'

export function MiAyuda({ currentRole, onOpenLibrary }: { currentRole: RoleInfo; onOpenLibrary: () => void }) {
  const [search, setSearch] = useState('')
  const [faqOpen, setFaqOpen] = useState<string | null>(null)
  const q = search.trim().toLowerCase()
  const guides = useMemo(() => GUIAS_PROCESOS.filter((guide) => {
    const relevant = currentRole.id === 'supervisores_campo'
      ? guide.rolesAplicables.some((item) => ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'ing_civil', 'ing_electrico'].includes(item))
      : guide.rolesAplicables.includes(currentRole.roleKey as Role)
    return relevant && (!q || `${guide.titulo} ${guide.subtitulo} ${guide.modulo} ${guide.etiquetas.join(' ')}`.toLowerCase().includes(q))
  }).slice(0, 5), [currentRole, q])
  const faqs = useMemo(() => GUIAS_FAQS.filter((faq) => faq.rolesAplicables.includes(currentRole.roleKey as Role)).filter((faq) => !q || `${faq.pregunta} ${faq.respuesta}`.toLowerCase().includes(q)).slice(0, 3), [currentRole, q])

  return <div className="space-y-4">
    <section>
      <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. crear requerimiento, registrar pago, tomar asistencia…" className="h-10 w-full rounded-xl border border-input bg-card pl-8 pr-4 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
    </section>

    {!q && <section className="space-y-3"><div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h3 className="text-base font-semibold">Lo más usado en tu rol</h3></div><div className="grid gap-3 sm:grid-cols-3">{currentRole.accionesRapidas.slice(0, 3).map((action) => <Link key={action.label} href={action.href} className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"><span className="block text-sm font-semibold">{action.label}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">Ir al módulo <ArrowRight className="size-3.5" /></span></Link>)}</div></section>}

    <section className="space-y-3"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><BookOpen className="size-4 text-primary" /><h3 className="text-base font-semibold">Guías para ti</h3></div><button onClick={onOpenLibrary} className="text-sm font-medium text-primary hover:underline">Ver biblioteca</button></div>{guides.length ? <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">{guides.map((guide) => <div key={guide.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-medium text-primary">{guide.modulo}</p><h4 className="mt-0.5 text-sm font-semibold">{guide.titulo}</h4><p className="mt-1 text-sm text-muted-foreground">{guide.subtitulo}</p></div>{guide.href && <Link href={guide.href} className="shrink-0 text-sm font-medium text-primary hover:underline">Abrir módulo</Link>}</div>)}</div> : <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No encontramos una guía con ese término.</p>}</section>

    {faqs.length > 0 && <section className="space-y-3"><div className="flex items-center gap-2"><CircleHelp className="size-4 text-primary" /><h3 className="text-base font-semibold">Resolver una duda</h3></div><div className="rounded-xl border border-border bg-card divide-y divide-border">{faqs.map((faq) => <div key={faq.id}><button onClick={() => setFaqOpen(faqOpen === faq.id ? null : faq.id)} aria-expanded={faqOpen === faq.id} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium hover:bg-muted/30">{faq.pregunta}<span className="text-primary">{faqOpen === faq.id ? '−' : '+'}</span></button>{faqOpen === faq.id && <div className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{faq.respuesta}{faq.moduloHref && <Link className="ml-2 font-medium text-primary hover:underline" href={faq.moduloHref}>Ir al módulo</Link>}</div>}</div>)}</div></section>}
  </div>
}
