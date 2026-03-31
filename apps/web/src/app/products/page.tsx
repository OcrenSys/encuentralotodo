import { AppShell } from '../../components/layout/app-shell';
import { ProductsScreen } from '../../modules/products/products-screen';

export default function ProductsPage() {
  return (
    <AppShell activePath="/products">
      <ProductsScreen />
    </AppShell>
  );
}
