"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const session = useAuth();
  if (!session) return null;

  return <AdminShell userName={session.name}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin" loginPath="/admin/login">
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthGuard>
  );
}
