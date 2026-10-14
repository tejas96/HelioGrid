import { SettingsRowScreen } from '../../../../features/settings';

/** Route entry for a settings row's screen before its own route exists — routing only. */
export default async function SettingsRowPage({ params }: { params: Promise<{ row: string }> }) {
  const { row } = await params;
  return <SettingsRowScreen segment={row} />;
}
