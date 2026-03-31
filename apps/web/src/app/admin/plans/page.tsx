import { AppShell } from '../../../components/layout/app-shell';
import { PlansScreen } from '../../../modules/admin/plans-screen';

export default function AdminPlansPage() {
  return (
    <AppShell activePath="/admin/plans">
      <PlansScreen />
    </AppShell>
  );
}