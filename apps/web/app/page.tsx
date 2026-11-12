import { redirect } from 'next/navigation';

/**
 * Redirect stub ONLY (apps/web/CLAUDE.md §Where files go) — every real screen is a named route folder.
 * `/home` sends unauthenticated visitors on to `/login`.
 */
export default function RootPage() {
  redirect('/home');
}
