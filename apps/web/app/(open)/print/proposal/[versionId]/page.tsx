import type { Metadata } from 'next';
import { PrintProposalScreen } from '../../../../../features/customer-link/print';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/**
 * Route entry for /print/proposal/<versionId>?grant=… — routing only. The document renderer alone
 * opens it (`T-M06-017`); the grant in the query is its whole authority, and the api refuses a page
 * without one that holds.
 */
export default async function PrintProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string }>;
  searchParams: Promise<{ grant?: string | string[] }>;
}) {
  const [{ versionId }, { grant }] = await Promise.all([params, searchParams]);
  return (
    <PrintProposalScreen versionId={versionId} grant={typeof grant === 'string' ? grant : ''} />
  );
}
