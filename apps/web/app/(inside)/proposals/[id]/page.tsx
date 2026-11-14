import { ProposalTrackScreen } from '../../../../features/proposals/track';

/**
 * Route entry for /proposals/<id> — routing only (`SCR-M06-18`). `?share=1` opens its share sheet
 * on arrival: the document's and the versions' *Share* lead here.
 */
export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string }>;
}) {
  const { id } = await params;
  const { share } = await searchParams;
  // A second proposal keeps this page mounted with new params: keyed by the id, it starts afresh.
  return <ProposalTrackScreen key={id} proposalId={id} share={share === '1'} />;
}
