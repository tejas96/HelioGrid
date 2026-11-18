import { SITE_DETAILS_FROM_PROPOSALS } from '../../../../../features/shell';
import { SiteDetailsScreen } from '../../../../../features/studio';

/**
 * Route entry for /designs/<id>/site — routing only (`SCR-M05-01`): the Site details a design starts
 * with; `?from=proposals` when the Proposals page made it, so its Cancel returns there.
 */
export default async function SiteDetailsPage({
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
    <SiteDetailsScreen
      key={id}
      designId={id}
      fromProposals={from === SITE_DETAILS_FROM_PROPOSALS}
    />
  );
}
