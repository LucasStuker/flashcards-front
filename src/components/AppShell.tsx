"use client";

import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AuthGate } from "./AuthGate";

type Props = {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  maxWidth?: "md" | "lg" | "xl";
};

const widths = {
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function AppShell({
  children,
  requireSuperAdmin = false,
  maxWidth = "xl",
}: Props) {
  return (
    <AuthGate requireSuperAdmin={requireSuperAdmin}>
      <div
        className={`mx-auto flex min-h-screen w-full ${widths[maxWidth]} flex-col gap-8 px-6 py-8`}
      >
        <AppHeader />
        {children}
      </div>
    </AuthGate>
  );
}
