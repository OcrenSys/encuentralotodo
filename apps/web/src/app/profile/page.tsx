import { AppShell } from '../../components/layout/app-shell';
import { ProfileScreen } from '../../modules/profile/profile-screen';

export default function ProfilePage() {
  return (
    <AppShell activePath="/profile">
      <ProfileScreen />
    </AppShell>
  );
}
