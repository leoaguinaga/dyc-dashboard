'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession, signOut } from '@/lib/auth/session'
import { ChevronsUpDown, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ProfileDialog } from './profile-dialog'

export default function UserButton() {
    const { data: session } = useSession()
    const router = useRouter()
    const user = session?.user
    const [profileOpen, setProfileOpen] = useState(false)

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
                <DropdownMenuItem
                    className="gap-2 w-42.5"
                    onClick={() => {
                        // El cierre del dropdown y la apertura del Dialog compiten por el
                        // mismo evento de click/outside-press; diferir a la siguiente tarea
                        // evita que el Dialog se cierre apenas se abre.
                        setTimeout(() => setProfileOpen(true), 0)
                    }}
                >
                    <User className="size-4" />
                    Perfil
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" className="gap-2 w-42.5" onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
            {user && (
                <ProfileDialog
                    open={profileOpen}
                    onOpenChange={setProfileOpen}
                    user={{
                        name: user.name ?? '',
                        email: user.email ?? '',
                        correoContacto: user.correoContacto,
                        role: user.role,
                    }}
                />
            )}
        </DropdownMenu>
    )
}
