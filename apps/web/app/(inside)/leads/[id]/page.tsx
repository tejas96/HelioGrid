import { LeadDetailScreen } from '../../../../features/lead-detail';

/** Route entry for /leads/<id> — routing only; the shell is this group's layout (`SCR-M02-04`). */
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A second lead keeps this page mounted with new params: keyed by the id, it starts afresh.
  return <LeadDetailScreen key={id} leadId={id} />;
}
