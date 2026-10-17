"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthUser, clearSession } from "../lib/auth";
import { useStoredUser } from "./AuthGate";
import { BrandMark } from "./BrandMark";
import { NavIcon, NavIconName } from "./NavIcon";

type NavItem = {
  label: string;
  icon: NavIconName;
  /** Sem `href`, o item aparece desabilitado como "em breve". */
  href?: string;
  isActive?: (pathname: string) => boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    id: "visao-geral",
    label: "Visão geral",
    items: [
      { label: "Início", icon: "home", href: "/", isActive: (p) => p === "/" },
      {
        label: "Desempenho",
        icon: "chart",
        href: "/desempenho",
        isActive: (p) => p === "/desempenho",
      },
      {
        label: "Cronograma",
        icon: "calendar",
        href: "/cronograma",
        isActive: (p) => p === "/cronograma",
      },
    ],
  },
  {
    id: "pratica",
    label: "Prática",
    items: [
      { label: "Estudo", icon: "timer" },
      {
        label: "Decks",
        icon: "cards",
        href: "/decks",
        isActive: (p) =>
          p === "/decks" || p.startsWith("/decks/") || p === "/history" || p === "/stats",
      },
    ],
  },
  {
    id: "planejamento",
    label: "Planejamento",
    items: [
      {
        label: "Concursos",
        icon: "target",
        href: "/editais",
        isActive: (p) => p === "/editais" || p.startsWith("/editais/"),
      },
      {
        label: "Disciplinas",
        icon: "folder",
        href: "/disciplinas",
        isActive: (p) => p === "/disciplinas" || p.startsWith("/disciplinas/"),
      },
    ],
  },
];

const focusRing = "outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-accent";

export function navItemClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors ${focusRing} ${
    active
      ? "bg-accent/10 font-medium text-accent-deep"
      : "text-ink/70 hover:bg-paper hover:text-ink"
  }`;
}

function greeting(user: AuthUser) {
  const primeiroNome = user.nome?.split(" ")[0];
  return primeiroNome ? `Olá, ${primeiroNome}` : user.email.split("@")[0];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStoredUser();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setAccountOpen(false);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (open) asideRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open && !accountOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (accountOpen) {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      } else {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, accountOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [accountOpen]);

  function dismissDrawer() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  function renderItem(item: NavItem) {
    if (!item.href) {
      return (
        <li key={item.label}>
          <span
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-1.5 text-muted/70"
          >
            <NavIcon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] font-medium text-muted">
              em breve
            </span>
          </span>
        </li>
      );
    }

    const active = item.isActive?.(pathname) ?? pathname === item.href;
    return (
      <li key={item.label}>
        <Link
          href={item.href}
          onClick={close}
          aria-current={active ? "page" : undefined}
          className={navItemClass(active)}
        >
          <NavIcon name={item.icon} />
          {item.label}
        </Link>
      </li>
    );
  }

  function renderAccountLink(href: string, label: string) {
    const active = pathname === href;
    return (
      <li>
        <Link
          href={href}
          onClick={close}
          aria-current={active ? "page" : undefined}
          className={navItemClass(active)}
        >
          {label}
        </Link>
      </li>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-2 md:hidden">
        <BrandMark size="sm" />
        <button
          ref={menuButtonRef}
          type="button"
          className={`flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-ink hover:bg-paper ${focusRing}`}
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={() => setOpen((value) => !value)}
        >
          <NavIcon name="menu" />
          Menu
        </button>
      </div>

      {open ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-ink/30 md:hidden"
          onClick={dismissDrawer}
        />
      ) : null}

      <aside
        id="app-sidebar"
        ref={asideRef}
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 flex-col border-r border-line bg-panel md:static md:z-auto ${
          open ? "flex shadow-pop md:shadow-none" : "hidden md:flex"
        }`}
      >
        <div className="px-4 pt-4 pb-5" onClick={close}>
          <BrandMark size="sm" />
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4 text-sm">
          {groups.map((group) => (
            <div key={group.id}>
              <p
                id={`nav-${group.id}`}
                className="px-2.5 pb-1.5 text-xs font-medium text-muted"
              >
                {group.label}
              </p>
              <ul aria-labelledby={`nav-${group.id}`} className="flex flex-col gap-0.5">
                {group.items.map(renderItem)}
              </ul>
            </div>
          ))}
        </nav>

        <div ref={accountRef} className="relative border-t border-line p-3 text-sm">
          {accountOpen ? (
            <div
              id="account-menu"
              className="absolute inset-x-3 bottom-full mb-1 rounded-lg border border-line bg-panel p-1 shadow-pop"
            >
              <ul className="flex flex-col gap-0.5">
                {renderAccountLink("/account", "Conta")}
                {user?.role === "super_admin" ? renderAccountLink("/users", "Admins") : null}
              </ul>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={logout}
                className={`w-full text-left ${navItemClass(false)}`}
              >
                Sair
              </button>
            </div>
          ) : null}

          <button
            ref={accountButtonRef}
            type="button"
            aria-expanded={accountOpen}
            aria-controls="account-menu"
            onClick={() => setAccountOpen((value) => !value)}
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-paper ${focusRing}`}
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-paper"
            >
              {(user?.nome || user?.email || "?").charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ink">{user ? greeting(user) : "Conta"}</span>
              {user ? (
                <span className="block truncate text-xs text-muted" title={user.email}>
                  {user.email}
                </span>
              ) : null}
            </span>
            <NavIcon name="chevrons" className="h-4 w-4 text-muted" />
          </button>
        </div>
      </aside>
    </>
  );
}
