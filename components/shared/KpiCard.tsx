import { cn } from '@/lib/utils'

interface KpiDelta {
  label: string
  trend: 'up' | 'down' | 'neutral'
}

interface KpiCardProps {
  label: string
  value: string | number
  delta?: KpiDelta
  context?: string
  className?: string
}

export function KpiCard({ label, value, delta, context, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-background p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {delta && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
              delta.trend === 'up' && 'bg-chart-2/15 text-chart-2',
              delta.trend === 'down' && 'bg-destructive/10 text-destructive',
              delta.trend === 'neutral' && 'bg-muted text-muted-foreground',
            )}
          >
            {delta.trend === 'up' && '▲'}
            {delta.trend === 'down' && '▼'}
            {delta.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums text-foreground">{value}</p>
        {context && (
          <p className="mt-1 text-xs text-muted-foreground">{context}</p>
        )}
      </div>
    </div>
  )
}

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-4 rounded-lg border border-border bg-background p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-12 animate-pulse rounded-md bg-muted" />
      </div>
      <div>
        <div className="h-8 w-14 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  )
}
