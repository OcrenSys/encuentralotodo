import { AppShell } from '../../components/layout/app-shell';
import { PromotionsScreen } from '../../modules/promotions/promotions-screen';

export default function PromotionsPage() {
  return (
    <AppShell activePath="/promotions">
      <PromotionsScreen />
    </AppShell>
  );
}