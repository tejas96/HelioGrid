import { redirect } from 'next/navigation';

/**
 * Redirect stub ONLY (CLAUDE.md §Structure) — every real screen is a named route folder.
 * `/home` sends unauthenticated visitors on to `/login`.
 */
export default function RootPage() {
  redirect('/home');
}
