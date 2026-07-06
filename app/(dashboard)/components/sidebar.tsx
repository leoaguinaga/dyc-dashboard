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
      <div className="pl-6 py-5 flex items-center gap-2">
        <div className='flex items-center justify-center h-9 w-12 rounded-md bg-primary/70 text-white font-bold text-base'>
          <p>DC</p>
        </div>
        <p className='text-sm leading-4 font-medium'>D&C Ingeniería Proyectos</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <span className="mb-1.5 block px-3 text-sm text-muted-foreground/60">
              {group.label}
            </span>
            <div className="flex flex-col gap-3">
              {groups && group.items.map((item) => {
                const active = !item.disabled && pathname.startsWith(item.href)

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-2 pl-3 pr-3 text-sm opacity-40 cursor-not-allowed select-none"
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
                      'flex items-center gap-2 pl-3 pr-3 text-sm',
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
    <aside className="hidden md:flex w-51 shrink-0 flex-col border-r border-sidebar-border h-full">
      <SidebarLinks />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-51 p-0 gap-0">
        <SidebarLinks onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
