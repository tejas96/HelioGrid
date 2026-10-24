import { RolesReferenceScreen } from '../../../../features/roles-reference';

/** Route entry for /more/roles — routing only; `?from=` names the page that opened it. */
export default async function RolesReferencePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <RolesReferenceScreen from={from ?? null} />;
}
