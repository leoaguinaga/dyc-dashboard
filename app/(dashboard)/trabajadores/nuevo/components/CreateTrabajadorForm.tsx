'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Wand2, Copy, Check } from 'lucide-react'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel
} from '@/components/ui/select'
import type { Role } from '@/types/api'

const DOMAIN = '@dycingenieriayproyectos.com'

function suggestEmail(nombre: string): string {
  const parts = nombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z\s]/g, '').trim()
    .split(/\s+/).slice(0, 2)
  return parts.join('.') + DOMAIN
}

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  const buf = new Uint8Array(12)
  crypto.getRandomValues(buf)
  const chars = [
    upper[buf[0] % upper.length],
    lower[buf[1] % lower.length],
    digits[buf[2] % digits.length],
    special[buf[3] % special.length],
    ...Array.from({ length: 8 }, (_, i) => all[buf[4 + i] % all.length]),
  ]
  const order = new Uint8Array(chars.length)
  crypto.getRandomValues(order)
  return chars.map((c, i) => ({ c, r: order[i] })).sort((a, b) => a.r - b.r).map((x) => x.c).join('')
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'logistica', label: 'Logística' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'administrador', label: 'Administrador' },
]

const CARGOS = [
  {
    group: "Supervisor de obra",
    roles: [
      "Supervisor Civil",
      "Supervisor Eléctrico",
      "Prevencionista de riesgo",
      "Residente de obra"
    ]
  },
  {
    group: "Back office",
    roles: [
      "Ingeniero Eléctrico",
      "Ingeniero Civil",
      "Jefe SIG",
    ]
  },
  {
    group: "Logística",
    roles: [
      "Administrador",
      "Asistente Logística",
      "Asistente Administración",
    ]
  },
  {
    group: "Gerencia",
    roles: [
      "Gerente General",
      "Gerente Operaciones",
      "Gerente Administrativo",
    ]
  },
  {
    group: "Obreros",
    roles: [
      "Operario",
      "Técnico",
    ]
  }
]

type FormState = {
  nombre: string
  dni: string
  cargo: string
  telefono: string
  email: string
  activo: boolean
  crearUsuario: boolean
  role: Role | ''
  password: string
  confirmPassword: string
}

const initial: FormState = {
  nombre: '',
  dni: '',
  cargo: '',
  telefono: '',
  email: '',
  activo: true,
  crearUsuario: false,
  role: '',
  password: '',
  confirmPassword: '',
}

const labelCn = 'mb-1.5 block text-sm font-medium'
const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'

export function CreateTrabajadorForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleGeneratePassword() {
    const pwd = generatePassword()
    setForm((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }))
    setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }))
    setShowPassword(true)
  }

  async function handleCopyPassword() {
    if (!form.password) return
    await navigator.clipboard.writeText(form.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: typeof errors = {}
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido'
    if (!form.dni.trim()) next.dni = 'El DNI es requerido'

    if (form.crearUsuario) {
      if (!form.email.trim()) next.email = 'El email es requerido para crear acceso al sistema'
      if (!form.role) next.role = 'Selecciona un rol para el acceso al sistema'
      if (form.password.length < 8) next.password = 'La contraseña debe tener al menos 8 caracteres'
      if (form.password !== form.confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    const payload: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      dni: form.dni.trim(),
      activo: form.activo,
    }
    if (form.cargo) payload.cargo = form.cargo.trim()
    if (form.telefono) payload.telefono = form.telefono.trim()
    if (form.email) payload.email = form.email.trim()
    if (form.crearUsuario) {
      payload.crearUsuario = true
      payload.role = form.role
      payload.password = form.password
    }

    try {
      await api.post('/trabajadores', payload)
      router.push('/trabajadores')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al registrar el trabajador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="gap-8 flex flex-col bg-white">

      {/* Datos personales */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Datos personales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>
              Nombre completo <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Juan Pérez González"
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>
            )}
          </div>
          <div>
            <label className={labelCn}>
              DNI <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.dni}
              onChange={(e) => set('dni', e.target.value)}
              placeholder="12345678"
              className="font-mono"
              aria-invalid={!!errors.dni}
            />
            {errors.dni && (
              <p className="mt-1 text-xs text-destructive">{errors.dni}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Cargo</label>
            <Select
              value={form.cargo}
              onValueChange={(v) => set('cargo', v ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cargo" />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((c) => (
                  <SelectGroup key={c.group}>
                    <SelectLabel>{c.group}</SelectLabel>
                    {c.roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCn}>Teléfono</label>
            <PhoneInput
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              placeholder="987 654 321"
            />
          </div>
        </div>
      </section>

      {/* Contacto y estado */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Contacto y estado</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>
              Email
              {form.crearUsuario && <span className="text-destructive"> *</span>}
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder={`juan.perez${DOMAIN}`}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
            {form.nombre && !form.email.includes('@') && (() => {
              const suggestion = suggestEmail(form.nombre)
              return (
                <button
                  type="button"
                  onClick={() => set('email', suggestion)}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors duration-[120ms] hover:bg-muted/70 hover:text-foreground"
                >
                  <Wand2 className="size-3 shrink-0" />
                  {suggestion}
                </button>
              )
            })()}
          </div>
          <div>
            <label className={labelCn}>Estado</label>
            <Select
              value={form.activo ? 'activo' : 'inactivo'}
              onValueChange={(v) => set('activo', v === 'activo')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Acceso al sistema */}
      <section className="space-y-4 col-span-2">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleCn}>Acceso al sistema</h2>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={form.crearUsuario}
              onClick={() => set('crearUsuario', !form.crearUsuario)}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors duration-150]',
                form.crearUsuario ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            >
              <span className={cn(
                'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                form.crearUsuario ? 'translate-x-4' : 'translate-x-0.5',
              )} />
            </button>
            <span className="text-sm text-muted-foreground">
              {form.crearUsuario ? 'Con acceso' : 'Sin acceso'}
            </span>
          </label>
        </div>

        {!form.crearUsuario ? (
          <p className="text-sm text-muted-foreground">
            El trabajador no tendrá cuenta en el sistema. Puedes habilitarla más adelante.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in-0 slide-in-from-top-1 duration-200ms">
            <div>
              <label className={labelCn}>
                Rol en el sistema <span className="text-destructive">*</span>
              </label>
              <Select
                value={form.role}
                onValueChange={(v) => set('role', (v ?? '') as Role | '')}
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Seleccionar rol…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="mt-1 text-xs text-destructive">{errors.role}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={cn(labelCn, 'mb-0')}>
                  Contraseña temporal <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors duration-[120ms] hover:bg-muted/70 hover:text-foreground"
                >
                  <Wand2 className="size-3" />
                  Sugerir
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  className={cn('pr-16', showPassword && 'font-mono tracking-wider')}
                  aria-invalid={!!errors.password}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {form.password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copiar contraseña"
                    >
                      {copied ? <Check className="size-3.5 text-chart-2" /> : <Copy className="size-3.5" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelCn}>
                Confirmar contraseña <span className="text-destructive">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="Repite la contraseña"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        )}
      </section>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4 col-span-2">
        <Link href="/trabajadores" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? 'Guardando…' : 'Registrar trabajador'}
        </Button>
      </div>
    </form>
  )
}
