"use client";

import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AuthGate } from "./AuthGate";

type Props = {
  children: ReactNode;
  action?: ReactNode;
  requireSuperAdmin?: boolean;
  maxWidth?: "md" | "study" | "lg";
};

const widths = {
  md: "max-w-lg",
  study: "max-w-xl",
  lg: "max-w-3xl",
};

export function AppShell({
  children,
  action,
  requireSuperAdmin = false,
  maxWidth = "lg",
}: Props) {
  return (
    <AuthGate requireSuperAdmin={requireSuperAdmin}>
      <div className="min-h-screen">
        <AppHeader action={action} />
        <div
          className={`mx-auto flex w-full ${widths[maxWidth]} flex-col gap-4 px-4 py-4`}
        >
          {children}
        </div>
      </div>
    </AuthGate>
  );
}
