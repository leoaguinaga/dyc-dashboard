'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { getVisibleGroups } from './routes-config'
import { useExcepcionesModulo } from '@/lib/accesos'

import UserButton from './user-button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

// Filas por grupo del skeleton mientras llega el rol (aprox. al menú de un admin).
const SKELETON_GROUPS = [1, 2, 5, 3, 2, 2]

const enterProps = (animate: boolean, index: number) =>
  animate
    ? {
        className: 'nav-enter',
        style: { '--nav-delay': `${Math.min(index * 25, 250)}ms` } as React.CSSProperties,
      }
    : { className: '', style: undefined }

function NavSkeleton() {
  return (
    <nav aria-hidden className="flex-1 overflow-hidden px-3 py-2 space-y-4">
      {SKELETON_GROUPS.map((rows, g) => (
        <div key={g}>
          {g > 0 && <div className="mb-1 mx-3 h-2.5 w-20 animate-pulse rounded bg-muted" />}
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex min-h-11 items-center gap-2 px-3 md:min-h-8">
                <div className="size-[18px] shrink-0 animate-pulse rounded bg-muted" />
                <div className="h-2.5 animate-pulse rounded bg-muted" style={{ width: 60 + ((g * 7 + i * 13) % 5) * 12 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarLinks({
  onLinkClick,
  animate = true,
}: {
  onLinkClick?: () => void
  animate?: boolean
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role
  const excepciones = useExcepcionesModulo()
  const groups = getVisibleGroups(role, excepciones)
  let enterIndex = 0

  return (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className='flex items-center justify-center h-9 w-12 rounded-md bg-primary/70 text-white font-bold text-base'>
          <p>DC</p>
        </div>
        <p className='text-sm leading-4 font-medium'>D&C Ingeniería Proyectos</p>
      </div>

      {!role ? <NavSkeleton /> : (
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            {!group.hideLabel && (() => {
              const enter = enterProps(animate, enterIndex)
              return (
                <span
                  style={enter.style}
                  className={cn('mb-1 block px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase', enter.className)}
                >
                  {group.label}
                </span>
              )
            })()}
            <div className="flex flex-col gap-0.5">
              {groups && group.items.map((item) => {
                const active = !item.disabled && pathname.startsWith(item.href)
                const enter = enterProps(animate, enterIndex++)

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      style={enter.style}
                      className={cn('flex min-h-11 items-center gap-2 px-3 text-sm opacity-40 cursor-not-allowed select-none md:min-h-0', enter.className)}
                    >
                      <div className="h-7 w-0.75 rounded-full bg-transparent" />
                      <item.icon className="size-[18px] shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground flex-1">{item.label}</span>
                      {item.sprint && (
                        <span className="text-[10px] font-medium text-muted-foreground/60 border border-border rounded px-1 py-px leading-none mr-1">
                          {item.sprint}
                        </span>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    style={enter.style}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-md px-3 text-sm md:min-h-8',
                      'transition-colors duration-120',
                      enter.className,
                      active
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-[18px] shrink-0',
                        active && 'text-primary',
                      )}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      )}

      <div className='p-3 w-full'>
        <UserButton />
      </div>
    </>
  )
}

export function SidebarNav() {
  return (
    <aside className="hidden h-full w-51 shrink-0 flex-col border-r border-sidebar-border md:flex">
      <SidebarLinks />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-72 max-w-[calc(100vw-1rem)] gap-0 p-0 pb-[env(safe-area-inset-bottom)]">
        <SidebarLinks onLinkClick={() => setOpen(false)} animate={false} />
      </SheetContent>
    </Sheet>
  )
}
