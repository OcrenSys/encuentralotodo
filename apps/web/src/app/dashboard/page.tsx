import { AppShell } from '../../components/layout/app-shell';
import { DashboardScreen } from '../../modules/dashboard/dashboard-screen';

export default function DashboardPage() {
  return (
    <AppShell activePath="/dashboard">
      <DashboardScreen />
    </AppShell>
  );
}
