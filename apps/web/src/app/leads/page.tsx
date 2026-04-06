import { AppShell } from '../../components/layout/app-shell';
import { LeadsScreen } from '../../modules/leads/leads-screen';

export default function LeadsPage() {
  return (
    <AppShell activePath="/leads">
      <LeadsScreen />
    </AppShell>
  );
}