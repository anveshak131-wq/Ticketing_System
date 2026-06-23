import { LoginForm } from "@/components/auth/LoginForm";

export default function AgentLoginPage() {
  return (
    <LoginForm
      role="agent"
      title="Agent Portal"
      subtitle="Book tickets on behalf of passengers"
      redirectTo="/agent/dashboard"
      accentClass="from-accent to-orange-600"
    />
  );
}
