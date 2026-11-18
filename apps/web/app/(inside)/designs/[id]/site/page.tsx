import { SiteDetailsScreen } from '../../../../../features/studio';

/** Route entry for /designs/<id>/site — routing only (`SCR-M05-01`): the Site details a design starts with. */
export default async function SiteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A second design keeps this page mounted with new params: keyed by the id, it starts afresh.
  return <SiteDetailsScreen key={id} designId={id} />;
}
