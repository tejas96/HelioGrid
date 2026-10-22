import { InviteLandingScreen } from '../../../../features/onboarding';

/**
 * Route entry for /invite/<token> — routing only. The open group has no gate: the link opens to a
 * person with no account, to one signed in elsewhere, and to one already signed in here (`M01-13`).
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // A second link keeps this page mounted with new params: keyed by the token, it starts afresh.
  return <InviteLandingScreen key={token} token={token} />;
}
