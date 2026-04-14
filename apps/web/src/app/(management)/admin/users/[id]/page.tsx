import { AdminUserDetailScreen } from '../../../../../modules/admin/user-detail-screen';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminUserDetailScreen userId={id} />;
}
