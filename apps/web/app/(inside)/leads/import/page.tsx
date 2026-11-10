import { LeadImportScreen } from '../../../../features/lead-import';

/**
 * Route entry for /leads/import — the Lead Import Wizard (`SCR-M02-05`); routing only. `?job=`
 * names an import to open where it stands: the import's notice, or the address a start writes.
 */
export default async function LeadImportPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  return <LeadImportScreen job={job === undefined || job === '' ? null : job} />;
}
