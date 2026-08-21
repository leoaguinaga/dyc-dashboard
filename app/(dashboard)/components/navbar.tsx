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
        <Link
          href="/ayuda"
          className={`flex items-center gap-1 text-sm hover:text-black ${
            isAyuda ? 'text-black' : 'text-muted-foreground'
          }`}
        >
          <CircleQuestionMark className='size-4' />
          Ayuda
        </Link>
      </div>
    </header>
  )
}
