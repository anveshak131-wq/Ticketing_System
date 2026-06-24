import { AuthGuard } from "@/components/auth/AuthGuard";
import MetroLineManagement from "@/components/admin/MetroLineManager";

export default function MetroLinesPage() {
  return (
    <AuthGuard role="admin" loginPath="/admin/login">
      <MetroLineManagement />
    </AuthGuard>
  );
}