import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// El layout del panel no conoce la URL que se pidió. La pasamos por header para que,
// si no hay sesión, el login pueda devolver al usuario al enlace original.
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.searchParams.delete('_rsc')

  const headers = new Headers(request.headers)
  headers.set('x-pathname', url.pathname + url.search)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|.*\\..*).*)',
}
