import { LeadDetailScreen } from '../../../../features/lead-detail';

/**
 * Route entry for /leads/<id> — routing only; the shell is this group's layout (`SCR-M02-04`).
 * `?won=1` opens it on its *Mark won* sheet: a proposal's *Confirm won* leads here (`M07-62`).
 */
export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ won?: string }>;
}) {
  const { id } = await params;
  const { won } = await searchParams;
  // A second lead keeps this page mounted with new params: keyed by the id, it starts afresh.
  return <LeadDetailScreen key={id} leadId={id} won={won === '1'} />;
}
