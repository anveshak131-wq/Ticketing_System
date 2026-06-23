"use client";

import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  role: UserRole;
  loginPath: string;
  children: React.ReactNode;
}

export function AuthGuard({ role, loginPath, children }: AuthGuardProps) {
  const session = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace(loginPath);
      return;
    }
    if (session.role !== role) {
      router.replace(loginPath);
    }
  }, [session, role, loginPath, router]);

  if (!session || session.role !== role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
