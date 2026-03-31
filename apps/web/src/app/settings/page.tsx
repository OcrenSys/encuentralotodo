import { AppShell } from '../../components/layout/app-shell';
import { SettingsScreen } from '../../modules/settings/settings-screen';

export default function SettingsPage() {
  return (
    <AppShell activePath="/settings">
      <SettingsScreen />
    </AppShell>
  );
}