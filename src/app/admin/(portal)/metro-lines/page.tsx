import { AuthGuard } from "@/components/auth/AuthGuard";
import MetroLineManagement from "@/components/admin/MetroLineManager";

export default function MetroLinesPage() {
  return (
    <AuthGuard requiredRole="admin">
      <MetroLineManagement />
    </AuthGuard>
  );
}