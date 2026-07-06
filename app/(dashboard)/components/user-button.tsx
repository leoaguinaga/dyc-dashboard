'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession, signOut } from '@/lib/auth/session'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UserButton() {
    const { data: session } = useSession()
    const router = useRouter()
    const user = session?.user

    const initials = user?.name
        ? user.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
        : '?'

    async function handleSignOut() {
        await signOut()
        router.push('/')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-120 hover:bg-muted/70 data-popup-open:border data-open:border-border"
            >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                        {user?.name ?? 'Usuario'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {user?.email ?? ''}
                    </p>
                </div>
                <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-full">
                <DropdownMenuItem variant="destructive" className="gap-2 w-42.5" onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
