import { ProposalLinksScreen } from '../../../../../features/proposals/links';

/** Route entry for /proposals/<id>/links — routing only (`SCR-M06-20`). */
export default async function ProposalLinksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProposalLinksScreen key={id} proposalId={id} />;
}
