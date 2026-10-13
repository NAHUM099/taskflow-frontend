import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { UsersContent } from "@/components/users/UsersContent";

export default function UsersPage() {
  return (
    <RequireAdmin>
      <UsersContent />
    </RequireAdmin>
  );
}
