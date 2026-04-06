import { AppShell } from '../../components/layout/app-shell';
import { BusinessScreen } from '../../modules/business/business-screen';

export default function BusinessPage() {
  return (
    <AppShell activePath="/business">
      <BusinessScreen />
    </AppShell>
  );
}
