import { AppShell } from '../../../components/layout/app-shell';
import { AdminBusinessesScreen } from '../../../modules/admin/businesses-screen';

export default function AdminBusinessesPage() {
  return (
    <AppShell activePath="/admin/businesses">
      <AdminBusinessesScreen />
    </AppShell>
  );
}