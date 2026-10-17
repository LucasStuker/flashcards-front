"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { navItemClass } from "./Sidebar";

type Props = {
  children: ReactNode;
  action?: ReactNode;
  maxWidth?: "md" | "study" | "lg" | "wide";
};

const widths = {
  md: "max-w-lg",
  study: "max-w-xl",
  lg: "max-w-3xl",
  wide: "max-w-7xl",
};

const deckAreaItems = [
  { href: "/decks", label: "Decks" },
  { href: "/history", label: "Histórico" },
  { href: "/stats", label: "Estatísticas" },
];

export function PageContainer({ children, action, maxWidth = "lg" }: Props) {
  const pathname = usePathname();
  const inDeckArea = deckAreaItems.some((item) => item.href === pathname);

  return (
    <div className={`mx-auto flex w-full ${widths[maxWidth]} flex-col gap-5 px-4 py-5 md:px-6 md:py-6`}>
      {action ? <div className="flex justify-end">{action}</div> : null}
      {inDeckArea ? (
        <nav aria-label="Área de decks" className="flex gap-1 text-sm">
          {deckAreaItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={navItemClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
      {children}
    </div>
  );
}
