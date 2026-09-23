"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthUser, clearSession, getStoredUser } from "../lib/auth";
import { useEffect, useState } from "react";

export function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <p className="text-sm text-muted">{user.email}</p>
      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <Link href="/" className="text-accent hover:text-accent-deep">
          Decks
        </Link>
        <Link href="/account" className="text-accent hover:text-accent-deep">
          Senha
        </Link>
        {user.role === "super_admin" ? (
          <Link href="/users" className="text-accent hover:text-accent-deep">
            Admins
          </Link>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="text-muted hover:text-ink"
        >
          Sair
        </button>
      </nav>
    </div>
  );
}
