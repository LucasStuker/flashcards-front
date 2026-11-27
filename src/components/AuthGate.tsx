"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AuthUser,
  clearSession,
  getStoredUser,
  getStoredUserRaw,
  getToken,
  parseStoredUser,
  setStoredUser,
  subscribeStoredUser,
} from "../lib/auth";
import { me } from "../lib/api";

type Props = {
  children: ReactNode;
  requireSuperAdmin?: boolean;
};

export function AuthGate({ children, requireSuperAdmin = false }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const cached = getStoredUser();
    if (cached) setUser(cached);

    void me()
      .then((u) => {
        setUser(u);
        setStoredUser(u);
        if (requireSuperAdmin && u.role !== "super_admin") {
          router.replace("/");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router, requireSuperAdmin]);

  if (!ready || !user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-muted">
        Verificando sessão…
      </main>
    );
  }

  return <>{children}</>;
}

export function useStoredUser(): AuthUser | null {
  const raw = useSyncExternalStore(subscribeStoredUser, getStoredUserRaw, () => null);
  return useMemo(() => parseStoredUser(raw), [raw]);
}
