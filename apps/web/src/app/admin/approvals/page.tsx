import { AppShell } from '../../../components/layout/app-shell';
import { ApprovalsScreen } from '../../../modules/admin/approvals-screen';

export default function AdminApprovalsPage() {
  return (
    <AppShell activePath="/admin/approvals">
      <ApprovalsScreen />
    </AppShell>
  );
}