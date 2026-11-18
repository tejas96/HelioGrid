import { SITE_DETAILS_FROM_PROPOSALS } from '../../../../features/shell';
import { DesignScreen } from '../../../../features/studio';

/**
 * Route entry for /designs/<id> — routing only (`SCR-M05-02`): one design's own page;
 * `?from=proposals` when the Proposals page opened it, so its way back returns there.
 */
export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  // A second design keeps this page mounted with new params: keyed by the id, it starts afresh.
  return (
    <DesignScreen key={id} designId={id} fromProposals={from === SITE_DETAILS_FROM_PROPOSALS} />
  );
}
