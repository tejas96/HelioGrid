import { redirect } from 'next/navigation';

/**
 * Redirect stub ONLY (apps/web/CLAUDE.md §Local conventions) — every real screen is a named route folder.
 * `/home` sends unauthenticated visitors on to `/login`.
 */
export default function RootPage() {
  redirect('/home');
}
