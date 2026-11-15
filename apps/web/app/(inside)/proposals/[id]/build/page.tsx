import { ProposalBuilderScreen } from '../../../../../features/proposal-builder';

/**
 * Route entry for /proposals/<id>/build — routing only (`SCR-M06-02`…`SCR-M06-13`). A focus screen:
 * the inside layout draws it with no shell. The step in view rides `?step=`, read by the screen.
 */
export default async function ProposalBuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A second proposal keeps this page mounted with new params: keyed by the id, it starts afresh.
  return <ProposalBuilderScreen key={id} proposalId={id} />;
}
