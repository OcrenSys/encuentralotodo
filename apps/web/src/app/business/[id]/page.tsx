import { BusinessDetailScreen } from '../../../components/business-detail-screen';

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BusinessDetailScreen businessId={id} />;
}