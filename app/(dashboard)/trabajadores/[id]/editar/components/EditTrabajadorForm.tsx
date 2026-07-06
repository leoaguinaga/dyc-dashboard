'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Wand2, Copy, Check, ShieldCheck, Trash2 } from 'lucide-react'
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Role, Trabajador } from '@/types/api'

const DOMAIN = '@dycingenieriayproyectos.com'

const ROLES: { value: Role; label: string }[] = [
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'logistica', label: 'Logística' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'administrador', label: 'Administrador' },
]

const CARGOS = [
  {
    group: 'Supervisor de obra',
    roles: ['Supervisor Civil', 'Supervisor Eléctrico', 'Prevencionista de riesgo', 'Residente de obra'],
  },
  { group: 'Back office', roles: ['Ingeniero Eléctrico', 'Ingeniero Civil', 'Jefe SIG'] },
  { group: 'Logística', roles: ['Administrador', 'Asistente Logística', 'Asistente Administración'] },
  { group: 'Gerencia', roles: ['Gerente General', 'Gerente Operaciones', 'Gerente Administrativo'] },
  { group: 'Obreros', roles: ['Operario', 'Técnico'] },
]

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  const buf = new Uint8Array(12)
  crypto.getRandomValues(buf)
  const chars = [
    upper[buf[0] % upper.length], lower[buf[1] % lower.length],
    digits[buf[2] % digits.length], special[buf[3] % special.length],
    ...Array.from({ length: 8 }, (_, i) => all[buf[4 + i] % all.length]),
  ]
  const order = new Uint8Array(chars.length)
  crypto.getRandomValues(order)
  return chars.map((c, i) => ({ c, r: order[i] })).sort((a, b) => a.r - b.r).map((x) => x.c).join('')
}

type FormState = {
  nombre: string
  dni: string
  cargo: string
  telefono: string
  email: string
  activo: boolean
}

type AccesoState = {
  emailAcceso: string
  role: Role | ''
  password: string
  confirmPassword: string
}

const labelCn = 'mb-1.5 block text-sm font-medium'
const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'

interface Props {
  trabajador: Trabajador
}

export function EditTrabajadorForm({ trabajador: t }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    nombre: t.nombre,
    dni: t.dni,
    cargo: t.cargo ?? '',
    telefono: t.telefono ?? '',
    email: t.email ?? '',
    activo: t.activo,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Acceso al sistema (solo cuando no tiene usuario)
  const [acceso, setAcceso] = useState<AccesoState>({
    emailAcceso: t.email ?? '',
    role: '',
    password: '',
    confirmPassword: '',
  })
  const [accesoErrors, setAccesoErrors] = useState<Partial<Record<keyof AccesoState, string>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [crearAcceso, setCrearAcceso] = useState(false)

  // Soft delete
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function setAcc<K extends keyof AccesoState>(key: K, value: AccesoState[K]) {
    setAcceso((prev) => ({ ...prev, [key]: value }))
    if (accesoErrors[key]) setAccesoErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleGeneratePassword() {
    const pwd = generatePassword()
    setAcceso((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }))
    setAccesoErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }))
    setShowPassword(true)
  }

  async function handleCopyPassword() {
    if (!acceso.password) return
    await navigator.clipboard.writeText(acceso.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function validate() {
    const next: typeof errors = {}
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido'
    if (!form.dni.trim()) next.dni = 'El DNI es requerido'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function validateAcceso() {
    const next: typeof accesoErrors = {}
    if (!acceso.emailAcceso.trim()) next.emailAcceso = 'El email es requerido'
    if (!acceso.role) next.role = 'Selecciona un rol'
    if (acceso.password.length < 8) next.password = 'Mínimo 8 caracteres'
    if (acceso.password !== acceso.confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden'
    setAccesoErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const basicOk = validate()
    const accesoOk = !crearAcceso || validateAcceso()
    if (!basicOk || !accesoOk) return

    setLoading(true)
    setServerError(null)

    try {
      await api.patch(`/trabajadores/${t.id}`, {
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
        activo: form.activo,
        cargo: form.cargo.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
      })

      if (crearAcceso) {
        await api.post(`/trabajadores/${t.id}/acceso`, {
          email: acceso.emailAcceso.trim(),
          role: acceso.role,
          password: acceso.password,
        })
      }

      router.push(`/trabajadores/${t.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  async function handleSoftDelete() {
    setDeleting(true)
    try {
      await api.patch(`/trabajadores/${t.id}/eliminar`, {})
      router.push('/trabajadores')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al eliminar el trabajador')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-white">

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
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
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
            {errors.dni && <p className="mt-1 text-xs text-destructive">{errors.dni}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Cargo</label>
            <Select value={form.cargo} onValueChange={(v) => set('cargo', v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cargo" />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((c) => (
                  <SelectGroup key={c.group}>
                    <SelectLabel>{c.group}</SelectLabel>
                    {c.roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
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
            <label className={labelCn}>Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder={`juan.perez${DOMAIN}`}
            />
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleCn}>Acceso al sistema</h2>
          {t.user ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2">
              <ShieldCheck className="size-3" />
              Activo · {t.user.role}
            </span>
          ) : (
            <label className="flex cursor-pointer select-none items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={crearAcceso}
                onClick={() => setCrearAcceso((v) => !v)}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors duration-[150ms]',
                  crearAcceso ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              >
                <span className={cn(
                  'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-[150ms]',
                  crearAcceso ? 'translate-x-4' : 'translate-x-0.5',
                )} />
              </button>
              <span className="text-sm text-muted-foreground">
                {crearAcceso ? 'Crear acceso' : 'Sin acceso'}
              </span>
            </label>
          )}
        </div>

        {t.user ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
            <p className="text-muted-foreground">
              Rol: <span className="font-medium text-foreground capitalize">{t.user.role}</span>
            </p>
            <p className="text-muted-foreground">
              Email: <span className="font-medium text-foreground">{t.user.email}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              La cuenta de acceso se gestiona por separado.
            </p>
          </div>
        ) : !crearAcceso ? (
          <p className="text-sm text-muted-foreground">
            El trabajador no tiene cuenta en el sistema. Activa la opción para crear una.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in-0 slide-in-from-top-1 duration-[200ms]">
            <div>
              <label className={labelCn}>
                Email de acceso <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={acceso.emailAcceso}
                onChange={(e) => setAcc('emailAcceso', e.target.value)}
                placeholder={`juan.perez${DOMAIN}`}
                aria-invalid={!!accesoErrors.emailAcceso}
              />
              {accesoErrors.emailAcceso && (
                <p className="mt-1 text-xs text-destructive">{accesoErrors.emailAcceso}</p>
              )}
            </div>
            <div>
              <label className={labelCn}>
                Rol en el sistema <span className="text-destructive">*</span>
              </label>
              <Select
                value={acceso.role}
                onValueChange={(v) => setAcc('role', (v ?? '') as Role | '')}
              >
                <SelectTrigger className="w-full" aria-invalid={!!accesoErrors.role}>
                  <SelectValue placeholder="Seleccionar rol…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accesoErrors.role && (
                <p className="mt-1 text-xs text-destructive">{accesoErrors.role}</p>
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
                  value={acceso.password}
                  onChange={(e) => setAcc('password', e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  className={cn('pr-16', showPassword && 'font-mono tracking-wider')}
                  aria-invalid={!!accesoErrors.password}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {acceso.password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
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
              {accesoErrors.password && (
                <p className="mt-1 text-xs text-destructive">{accesoErrors.password}</p>
              )}
            </div>
            <div>
              <label className={labelCn}>
                Confirmar contraseña <span className="text-destructive">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={acceso.confirmPassword}
                onChange={(e) => setAcc('confirmPassword', e.target.value)}
                placeholder="Repite la contraseña"
                aria-invalid={!!accesoErrors.confirmPassword}
              />
              {accesoErrors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{accesoErrors.confirmPassword}</p>
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

      {/* Acciones */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {/* Soft delete */}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Eliminar trabajador
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in-0 duration-[150ms]">
            <p className="text-sm text-destructive">¿Confirmar eliminación?</p>
            <button
              type="button"
              onClick={handleSoftDelete}
              disabled={deleting}
              className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <a href={`/trabajadores/${t.id}`} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancelar
          </a>
          <Button type="submit" disabled={loading} className="min-w-28">
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </form>
  )
}
