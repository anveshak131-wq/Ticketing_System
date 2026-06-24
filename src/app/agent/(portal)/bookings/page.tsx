import { BookingManager } from "@/components/agent/BookingManager";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AgentBookingsPage() {
  return (
    <AuthGuard role="agent" loginPath="/agent/login">
      <BookingManager />
    </AuthGuard>
  );
}
