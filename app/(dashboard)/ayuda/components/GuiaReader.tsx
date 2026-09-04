import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileText,
  Lightbulb,
  PlayCircle,
} from 'lucide-react'
import type { HelpVideo } from '@/types/api'
import type { GuiaFaq, GuiaProceso } from '../catalogo'
import { GLOSARIO_TERMINOS } from '../catalogo'
import { cn } from '@/lib/utils'

interface Props {
  guia: GuiaProceso
  relacionadas: GuiaProceso[]
  faqs: GuiaFaq[]
  videos: HelpVideo[]
  onSelect: (id: string) => void
  onBack: () => void
}

const estadoClasses = {
  green: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  blue: 'bg-blue-500/10 text-blue-800 dark:text-blue-300',
  amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  purple: 'bg-purple-500/10 text-purple-800 dark:text-purple-300',
  slate: 'bg-muted text-muted-foreground',
  red: 'bg-red-500/10 text-red-800 dark:text-red-300',
} as const

export function GuiaReader({ guia, relacionadas, faqs, videos, onSelect, onBack }: Props) {
  const textoGuia = `${guia.titulo} ${guia.subtitulo} ${guia.objetivo} ${guia.etiquetas.join(' ')}`.toLocaleLowerCase('es')
  const conceptos = GLOSARIO_TERMINOS.filter((item) =>
    textoGuia.includes(item.termino.replace(/\s*\([^)]*\)/g, '').toLocaleLowerCase('es')),
  ).slice(0, 3)

  return (
    <article aria-labelledby={`guia-${guia.id}`} className="min-w-0 bg-card">
      <div className="border-b border-border px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <ArrowLeft className="size-4" />
          Volver a resultados
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{guia.modulo}</span><span aria-hidden="true">/</span>
              <span>{guia.pasos.length} {guia.pasos.length === 1 ? 'paso' : 'pasos'}</span>
            </p>
            <h2 id={`guia-${guia.id}`} className="max-w-3xl text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {guia.titulo}
            </h2>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{guia.subtitulo}</p>
          </div>
          {guia.href && (
            <Link
              href={guia.href}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Abrir módulo <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-8">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby={`objetivo-${guia.id}`} className="space-y-3">
            <h3 id={`objetivo-${guia.id}`} className="flex items-center gap-2 text-base font-semibold text-foreground">
              <BookOpenCheck className="size-4 text-primary" />Qué lograrás
            </h3>
            <p className="max-w-3xl text-base leading-7 text-foreground/90">{guia.objetivo}</p>
          </section>

          {guia.requisitosPrevios?.length ? (
            <section aria-labelledby={`requisitos-${guia.id}`} className="space-y-3">
              <h3 id={`requisitos-${guia.id}`} className="text-base font-semibold text-foreground">Antes de empezar</h3>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {guia.requisitosPrevios.map((requisito) => (
                  <li key={requisito} className="flex items-start gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-600" /><span>{requisito}</span></li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby={`pasos-${guia.id}`} className="space-y-4">
            <h3 id={`pasos-${guia.id}`} className="text-base font-semibold text-foreground">Paso a paso</h3>
            <ol className="divide-y divide-border border-y border-border">
              {guia.pasos.map((paso) => (
                <li key={paso.numero} className="flex gap-4 py-5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{paso.numero}</span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h4 className="text-base font-semibold leading-6 text-foreground">{paso.titulo}</h4>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{paso.descripcion}</p>
                    {paso.detalle?.length ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground marker:text-foreground/50">
                        {paso.detalle.map((detalle) => <li key={detalle}>{detalle}</li>)}
                      </ul>
                    ) : null}
                    {paso.tip ? (
                      <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm leading-5 text-emerald-900 dark:text-emerald-200">
                        <Lightbulb className="mt-0.5 size-4 shrink-0" /><span><strong>Consejo:</strong> {paso.tip}</span>
                      </div>
                    ) : null}
                    {paso.advertencia ? (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm leading-5 text-amber-950 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" /><span><strong>Ten en cuenta:</strong> {paso.advertencia}</span>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {guia.resultadoEsperado ? (
            <section className="flex items-start gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><h3 className="font-semibold">Resultado esperado</h3><p>{guia.resultadoEsperado}</p></div>
            </section>
          ) : null}

          {guia.estados?.length ? (
            <section aria-labelledby={`estados-${guia.id}`} className="space-y-3">
              <h3 id={`estados-${guia.id}`} className="text-base font-semibold text-foreground">Estados que encontrarás</h3>
              <div className="divide-y divide-border rounded-lg border border-border">
                {guia.estados.map((estado) => (
                  <div key={estado.estado} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                    <span className={cn('w-fit rounded-md px-2 py-1 text-xs font-semibold', estadoClasses[estado.color])}>{estado.estado}</span>
                    <p className="text-sm leading-5 text-muted-foreground">{estado.descripcion}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {guia.buenasPracticas?.length ? (
            <section aria-labelledby={`practicas-${guia.id}`} className="space-y-3">
              <h3 id={`practicas-${guia.id}`} className="text-base font-semibold text-foreground">Buenas prácticas</h3>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {guia.buenasPracticas.map((practica) => <li key={practica} className="flex items-start gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-600" /><span>{practica}</span></li>)}
              </ul>
            </section>
          ) : null}

          {faqs.length ? (
            <section aria-labelledby={`dudas-${guia.id}`} className="space-y-3">
              <h3 id={`dudas-${guia.id}`} className="flex items-center gap-2 text-base font-semibold text-foreground"><CircleHelp className="size-4 text-primary" />Dudas relacionadas</h3>
              <div className="divide-y divide-border rounded-lg border border-border">
                {faqs.slice(0, 3).map((faq) => (
                  <details key={faq.id} className="px-4 py-3">
                    <summary className="min-h-8 cursor-pointer pr-6 text-sm font-semibold leading-6 text-foreground">{faq.pregunta}</summary>
                    <div className="space-y-3 pb-1 pt-2 text-sm leading-6 text-muted-foreground">
                      <p>{faq.respuesta}</p>
                      {faq.solucionPasoAPaso?.length ? <ol className="list-decimal space-y-1 pl-5">{faq.solucionPasoAPaso.map((paso) => <li key={paso}>{paso}</li>)}</ol> : null}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {videos.length ? (
            <section aria-labelledby={`videos-${guia.id}`} className="space-y-3">
              <h3 id={`videos-${guia.id}`} className="flex items-center gap-2 text-base font-semibold text-foreground"><PlayCircle className="size-4 text-primary" />Videos relacionados</h3>
              <div className="divide-y divide-border rounded-lg border border-border">
                {videos.slice(0, 3).map((video) => (
                  <a key={video.id} href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <span><strong className="block text-foreground">{video.titulo}</strong>{video.descripcion ? <span className="mt-0.5 block text-muted-foreground">{video.descripcion}</span> : null}</span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Información de la guía</h3>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" />{guia.ultimaRevision ? `Revisada el ${guia.ultimaRevision}` : 'Revisión pendiente de registrar'}</p>
            {guia.version ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="size-4" />Versión {guia.version}</p> : null}
          </div>
          {conceptos.length ? (
            <div className="space-y-3"><h3 className="text-sm font-semibold text-foreground">Conceptos clave</h3><dl className="space-y-3">{conceptos.map((concepto) => <div key={concepto.termino}><dt className="text-sm font-semibold text-foreground">{concepto.termino}</dt><dd className="mt-1 text-sm leading-5 text-muted-foreground">{concepto.definicion}</dd></div>)}</dl></div>
          ) : null}
          {relacionadas.length ? (
            <div className="space-y-3"><h3 className="text-sm font-semibold text-foreground">Guías relacionadas</h3><div className="space-y-1">{relacionadas.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><FileText className="size-4 shrink-0" /><span>{item.titulo}</span></button>)}</div></div>
          ) : null}
        </aside>
      </div>
    </article>
  )
}
