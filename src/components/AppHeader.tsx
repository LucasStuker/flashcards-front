"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { AuthUser, clearSession, getStoredUser } from "../lib/auth";
import { BrandMark } from "./BrandMark";

type Props = {
  action?: ReactNode;
};

function navClass(active: boolean) {
  return active
    ? "text-ink"
    : "text-muted transition hover:text-ink";
}

export function AppHeader({ action }: Props) {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-4 px-4">
        <BrandMark size="md" />
        <nav className="flex min-w-0 flex-1 items-center gap-3 text-sm font-medium">
          <Link href="/" className={navClass(pathname === "/")}>
            Decks
          </Link>
          <Link
            href="/history"
            className={navClass(pathname === "/history")}
          >
            Histórico
          </Link>
        </nav>
        {action ? <div className="shrink-0">{action}</div> : null}
        <details className="account-menu relative shrink-0">
          <summary className="cursor-pointer text-sm text-muted hover:text-ink">
            <span className="sm:hidden">Conta</span>
            <span className="hidden max-w-36 truncate sm:inline">{user.email}</span>
          </summary>
          <div className="absolute right-0 z-20 mt-1 flex min-w-40 flex-col border border-line bg-panel py-1 text-sm shadow-sm">
            <Link
              href="/account"
              className="px-3 py-2 text-ink hover:bg-paper"
            >
              Conta
            </Link>
            {user.role === "super_admin" ? (
              <Link
                href="/users"
                className="px-3 py-2 text-ink hover:bg-paper"
              >
                Admins
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 text-left text-muted hover:bg-paper hover:text-ink"
            >
              Sair
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
