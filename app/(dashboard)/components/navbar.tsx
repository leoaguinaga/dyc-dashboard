'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CircleQuestionMark } from 'lucide-react'
import { findNavItem, findNavGroup } from './routes-config'
import { MobileSidebar } from './sidebar'
import { NotificationBell } from './notification-bell'

export function Navbar() {
  const pathname = usePathname()
  const group = findNavGroup(pathname)
  const item = findNavItem(pathname)
  const isAyuda = pathname.startsWith('/ayuda')

  return (
    <header className="flex min-h-13 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-2.5 py-1.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="md:hidden">
          <MobileSidebar />
        </div>
        <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm">
          {group && !group.hideLabel && (
            <>
              <span className="hidden text-muted-foreground sm:inline">{group.label}</span>
              <span className="hidden text-muted-foreground/40 sm:inline">/</span>
            </>
          )}
          <span className="truncate font-medium text-foreground">
            {item?.label ?? 'Dashboard'}
          </span>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <NotificationBell />
        <Link
          href="/ayuda"
          className={`flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg text-sm hover:bg-muted hover:text-black sm:min-h-0 sm:min-w-0 sm:justify-start sm:rounded-none sm:hover:bg-transparent ${
            isAyuda ? 'text-black' : 'text-muted-foreground'
          }`}
        >
          <CircleQuestionMark className='size-4' />
          <span className="hidden sm:inline">Ayuda</span>
        </Link>
      </div>
    </header>
  )
}
