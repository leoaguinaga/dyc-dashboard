import { useEffect, useState } from 'react';
import { createAuthClient } from 'better-auth/react';
import type { Role } from '@/types/api';

// With the Next.js proxy, auth requests go through /api on the same origin.
// NEXT_PUBLIC_APP_URL defaults to localhost:3000.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
});

export const { signIn, signOut, signUp } = authClient;

// Typed wrapper: better-auth exposes additionalFields at runtime but not in its
// default TypeScript types, so we cast the session user to include `role`.
type SessionUser = ReturnType<typeof authClient.useSession>['data'] extends
  { user: infer U } | null ? U & { role?: Role } : never;

export function useSession() {
  const session = authClient.useSession();
  // better-auth hydrates session data synchronously from a cookie-cache on the
  // client's first render, before the server (which has no such cache) could
  // ever render it — causing a hydration mismatch on any role-gated UI. Force
  // `data` to null until after mount so the first client render matches SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return {
    ...session,
    data: mounted ? session.data : null,
  } as typeof session & {
    data: { user: SessionUser; session: NonNullable<typeof session.data>['session'] } | null;
  };
}