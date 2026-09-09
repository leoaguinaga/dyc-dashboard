export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex min-h-dvh overflow-y-auto bg-[oklch(0.18_0.02_250)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(135deg, oklch(0.22 0.04 250) 0%, oklch(0.12 0.02 250) 50%, oklch(0.08 0.01 220) 100%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 60" stroke="white" strokeWidth="0.5" fill="none" />
            <path d="M 0 0 L 60 60" stroke="white" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="relative hidden w-1/2 lg:block">
        <div className="relative z-10 flex h-full flex-col justify-between p-9">
          <div className="flex flex-col items-start">
            <p className="text-5xl font-extrabold text-white">D<span className="text-orange-400 text-3xl">&</span>C</p>
            <span className="uppercase tracking-wider text-white font-light">Ingeniería</span>
          </div>
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight leading-tight text-white">
              Gestión integral de proyectos y cotizaciones.
            </h2>
            <p className="text-sm leading-relaxed text-white/50">
              Sistema interno para supervisores, logística y gerencia.
            </p>
          </div>
        </div>
      </div>
      <div
        data-auth-panel
        className="z-20 m-2 flex w-full items-center justify-center overflow-y-auto rounded-2xl bg-background px-4 py-8 sm:m-4 sm:rounded-3xl sm:px-6 [@media(max-height:500px)]:items-start [@media(max-height:500px)]:py-4 lg:w-1/2"
      >
        {children}
      </div>
    </div>
  )
}
