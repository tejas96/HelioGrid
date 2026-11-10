import { LeadsListScreen } from '../../../features/leads-list';
import { AddLeadScreen } from '../../../features/quick-add-lead';

/**
 * Route entry for /add-lead — quick add over the leads page (`SCR-M02-01`); routing only. A
 * referral arrives as `?referredBy=<the referring lead>` (`M02-16`).
 */
export default async function AddLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ referredBy?: string }>;
}) {
  const { referredBy } = await searchParams;
  return <AddLeadScreen referredBy={referredBy ?? null} behind={<LeadsListScreen />} />;
}
