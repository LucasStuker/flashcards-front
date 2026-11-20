import { AuthGate } from "@/components/AuthGate";

export default function ImportarLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate requireSuperAdmin>{children}</AuthGate>;
}
