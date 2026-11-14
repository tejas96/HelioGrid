import { readCustomerPage } from '@heliogrid/data/server';
import { notFound } from 'next/navigation';
import { API_URL } from '../../lib/env';
import { CustomerPageScreen } from './CustomerPageScreen';

/**
 * The customer's page, read on the server first (`F5-07`): the price and the answer controls are in
 * the first paint, before any picture or script has come. The read carries no visitor's cookie and
 * records no open — an open is sent by the drawn page alone (`T-F5-007`), so a messenger's link
 * preview never counts as one. An address no link has is the route's not-found.
 *
 * No search engine indexes the page or follows it (`F5-75`). The line is drawn here, beside the
 * page, and not in the route's metadata: Next writes its own `noindex` on every not-found, so a
 * metadata line would state robots twice there.
 */
export async function CustomerPageRoute({ token }: { token: string }) {
  const first = await readCustomerPage(API_URL, token);
  if (first.kind === 'gone') notFound();
  // A second link keeps this page mounted with new params: keyed by the token, it starts afresh.
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <CustomerPageScreen
        key={token}
        token={token}
        initial={first.kind === 'page' ? first.page : null}
      />
    </>
  );
}
