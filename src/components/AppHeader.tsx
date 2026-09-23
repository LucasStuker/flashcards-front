"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthUser, clearSession, getStoredUser } from "../lib/auth";
import { BrandMark } from "./BrandMark";

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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <BrandMark size="sm" />
      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <Link href="/" className="text-accent hover:text-accent-deep">
          Decks
        </Link>
        <Link href="/account" className="text-accent hover:text-accent-deep">
          Conta
        </Link>
        {user.role === "super_admin" ? (
          <Link href="/users" className="text-accent hover:text-accent-deep">
            Admins
          </Link>
        ) : null}
        <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
        <button type="button" onClick={logout} className="text-muted hover:text-ink">
          Sair
        </button>
      </nav>
    </header>
  );
}
