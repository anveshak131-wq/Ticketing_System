import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
  return (
    <LoginForm
      role="admin"
      title="Admin Panel"
      subtitle="Manage stations, trains, schedules & reservations"
      redirectTo="/admin/dashboard"
      accentClass="from-primary to-blue-700"
    />
  );
}
