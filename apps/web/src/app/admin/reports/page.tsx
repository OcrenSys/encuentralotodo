import { AppShell } from '../../../components/layout/app-shell';
import { ReportsScreen } from '../../../modules/admin/reports-screen';

export default function AdminReportsPage() {
  return (
    <AppShell activePath="/admin/reports">
      <ReportsScreen />
    </AppShell>
  );
}