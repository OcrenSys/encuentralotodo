import { AppShell } from '../../../components/layout/app-shell';
import { UsersScreen } from '../../../modules/admin/users-screen';

export default function AdminUsersPage() {
  return (
    <AppShell activePath="/admin/users">
      <UsersScreen />
    </AppShell>
  );
}
