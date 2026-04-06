import { AppShell } from '../../components/layout/app-shell';
import { TeamScreen } from '../../modules/team/team-screen';

export default function TeamPage() {
  return (
    <AppShell activePath="/team">
      <TeamScreen />
    </AppShell>
  );
}