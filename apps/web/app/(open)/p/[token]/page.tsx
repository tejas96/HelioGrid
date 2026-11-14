import type { Metadata } from 'next';
import { CustomerPageRoute } from '../../../../features/customer-link';

/**
 * A customer's own page is nobody else's to learn the address of (`F5-75`, `F5-77`): no page it
 * opens is told where the customer came from. Its robots line is `CustomerPageRoute`'s: Next writes
 * its own on the not-found, so one here would state it twice there.
 */
export const metadata: Metadata = { referrer: 'no-referrer' };

/**
 * Route entry for /p/<token> — routing only. The open group has no gate: the customer never signs
 * in (`F5-01`), and the token in the address is their whole authority (`F5-21`).
 */
export default async function CustomerLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerPageRoute token={token} />;
}
