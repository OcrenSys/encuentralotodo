import { AdminUserDetailScreen } from '../../../../modules/admin/user-detail-screen';

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <AdminUserDetailScreen userId={params.id} />;
}
