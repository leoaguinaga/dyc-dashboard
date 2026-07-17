import { ResetPasswordForm } from './reset-password-form'

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="lg:hidden">
        <span className="text-sm font-semibold tracking-tight text-foreground/70">
          D&C Ingeniería y Proyectos
        </span>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Elige una nueva contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu nueva contraseña para tu cuenta
        </p>
      </div>

      <ResetPasswordForm token={token} invalidToken={error === 'INVALID_TOKEN'} />
    </div>
  )
}
