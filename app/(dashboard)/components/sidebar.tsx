'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { getVisibleGroups } from './routes-config'

import UserButton from './user-button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

function SidebarLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role
  const groups = getVisibleGroups(role)

  return (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className='flex items-center justify-center h-9 w-12 rounded-md bg-primary/70 text-white font-bold text-base'>
          <p>DC</p>
        </div>
        <p className='text-sm leading-4 font-medium'>D&C Ingeniería Proyectos</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {!group.hideLabel && (
              <span className="mb-1.5 block px-3 text-sm text-muted-foreground/60">
                {group.label}
              </span>
            )}
            <div className="flex flex-col gap-3">
              {groups && group.items.map((item) => {
                const active = !item.disabled && pathname.startsWith(item.href)

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex min-h-11 items-center gap-2 px-3 text-sm opacity-40 cursor-not-allowed select-none md:min-h-0"
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
                    className={cn(
                      'flex min-h-11 items-center gap-2 px-3 text-sm md:min-h-0',
                      'transition-colors duration-120',
                      active
                        ? 'font-medium text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'h-7 w-0.75 rounded-full',
                        active ? 'bg-primary' : 'bg-transparent',
                      )}
                    />
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
        <SidebarLinks onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
