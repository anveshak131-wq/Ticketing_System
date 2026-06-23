"use client";

import { BookingWizard } from "@/components/book/BookingWizard";
import { useAuth } from "@/hooks/use-auth";

export default function AgentBookPage() {
  const session = useAuth();

  if (!session) return null;

  return (
    <BookingWizard
      mode="agent"
      agent={{
        id: session.userId,
        name: session.name,
        agentCode: session.agentCode,
      }}
    />
  );
}
