import { PlaceholderScreen } from '../../../features/shell';

/** Route entry for every door the shell opens before its module's own route exists — routing only. */
export default async function DoorPage({ params }: { params: Promise<{ door: string }> }) {
  const { door } = await params;
  return <PlaceholderScreen path={door} />;
}
