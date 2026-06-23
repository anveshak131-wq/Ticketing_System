"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AgentShell } from "@/components/agent/AgentShell";
import { useAuth } from "@/hooks/use-auth";

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  const session = useAuth();
  if (!session) return null;

  return (
    <AgentShell userName={session.name} agentCode={session.agentCode}>
      {children}
    </AgentShell>
  );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="agent" loginPath="/agent/login">
      <AgentLayoutInner>{children}</AgentLayoutInner>
    </AuthGuard>
  );
}
