import { cn } from '@/lib/utils'

export function ChartPanel({
  title,
  description,
  span,
  children,
}: {
  title: string
  description: string
  span: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', span)}>
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function GroupHeader({
  title,
  description,
  badge,
}: {
  title: string
  description: string
  badge?: string
}) {
  return (
    <div className="flex items-baseline gap-2.5">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <span className="text-sm text-muted-foreground">{description}</span>
      {badge && (
        <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
    </div>
  )
}
