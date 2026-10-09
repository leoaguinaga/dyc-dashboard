import { Textarea } from '@/components/ui/textarea'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ObservacionesCard({ value, onChange, placeholder = 'Contexto o justificación para quien revisa' }: Props) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
      <label htmlFor="reg-observaciones" className="mb-1.5 block text-[13px] font-medium">
        Observaciones generales <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      <Textarea
        id="reg-observaciones"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-20"
      />
    </section>
  )
}
