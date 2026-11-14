import { ProposalDocumentScreen } from '../../../../../features/proposals/document';

/** Route entry for /proposals/<id>/document — routing only (`SCR-M06-17`). `?v=2` names a version. */
export default async function ProposalDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;
  const version = v !== undefined && /^[1-9]\d*$/.test(v) ? Number(v) : null;
  return <ProposalDocumentScreen key={`${id}-${v ?? ''}`} proposalId={id} version={version} />;
}
