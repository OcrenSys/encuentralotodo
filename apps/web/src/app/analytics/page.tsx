import { AppShell } from '../../components/layout/app-shell';
import { AnalyticsScreen } from '../../modules/analytics/analytics-screen';

export default function AnalyticsPage() {
  return (
    <AppShell activePath="/analytics">
      <AnalyticsScreen />
    </AppShell>
  );
}