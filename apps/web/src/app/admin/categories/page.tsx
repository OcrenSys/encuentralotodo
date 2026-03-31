import { AppShell } from '../../../components/layout/app-shell';
import { CategoriesScreen } from '../../../modules/admin/categories-screen';

export default function AdminCategoriesPage() {
  return (
    <AppShell activePath="/admin/categories">
      <CategoriesScreen />
    </AppShell>
  );
}