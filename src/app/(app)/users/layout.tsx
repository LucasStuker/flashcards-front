import { AuthGate } from "@/components/AuthGate";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate requireSuperAdmin>{children}</AuthGate>;
}
