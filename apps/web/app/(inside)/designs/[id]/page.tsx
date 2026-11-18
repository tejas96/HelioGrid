import { DesignScreen } from '../../../../features/studio';

/** Route entry for /designs/<id> — routing only (`SCR-M05-02`): one design's own page. */
export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A second design keeps this page mounted with new params: keyed by the id, it starts afresh.
  return <DesignScreen key={id} designId={id} />;
}
