'use client'

import { usePathname } from 'next/navigation'
import { CircleQuestionMark } from 'lucide-react'
import { findNavItem, findNavGroup } from './routes-config'
import { MobileSidebar } from './sidebar'
import { NotificationBell } from './notification-bell'

export function Navbar() {
  const pathname = usePathname()
  const group = findNavGroup(pathname)
  const item = findNavItem(pathname)

  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-background px-5">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <MobileSidebar />
        </div>
        <nav className="flex items-center gap-1.5 text-sm">
          {group && (
            <>
              <span className="text-muted-foreground">{group.label}</span>
              <span className="text-muted-foreground/40">/</span>
            </>
          )}
          <span className="font-medium text-foreground">
            {item?.label ?? 'Dashboard'}
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className='flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-black'>
          <CircleQuestionMark className='size-4' />
          Ayuda
        </div>
      </div>
    </header>
  )
}
