import { ProposalVersionsScreen } from '../../../../../features/proposals/versions';

/** Route entry for /proposals/<id>/versions — routing only (`SCR-M06-16`). */
export default async function ProposalVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProposalVersionsScreen key={id} proposalId={id} />;
}
