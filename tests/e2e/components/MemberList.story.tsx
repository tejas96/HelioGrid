import { IN_FORMATS, type TeamStatusFilter, type TeamSurface, teamRoster } from '@heliogrid/domain';
import { createTranslator, teamListWords } from '@heliogrid/i18n';
import { MemberList } from '@heliogrid/ui';

const en = await createTranslator('en');

/* 31 Aug 2026, 09:20 in Asia/Kolkata — the boards' clock. */
const NOW = Date.parse('2026-08-31T03:50:00Z');
const DAY = 86_400_000;

const ROWS = teamRoster(
  [
    {
      membershipId: 'm-1',
      userId: 'u-rajesh',
      name: 'Rajesh Patil',
      phoneE164: '+919800000001',
      roles: ['epc_owner'],
      status: 'active',
      lastActiveAt: '2026-08-31T03:00:00Z',
    },
  ],
  [
    {
      id: 'i-1',
      inviteeName: 'Anjali Kulkarni',
      phoneE164: '+919700000001',
      roles: ['sales_manager', 'survey_engineer', 'project_manager'],
      status: 'pending',
      sentAt: new Date(NOW - 2 * DAY).toISOString(),
      expiresAt: new Date(NOW + 5 * DAY).toISOString(),
    },
  ],
  'u-rajesh',
  NOW,
  'en',
);

/**
 * The Team list's body as both screens draw it, with the rows and every word built here in the
 * browser: `words.row` is read while the list renders, and a function handed to `mount` answers
 * from the test process — a promise, never the words.
 */
export function TeamListStory({
  surface,
  company,
  query = '',
  status = 'all',
  onRetry = () => undefined,
  onClearSearch = () => undefined,
  onShowAll = () => undefined,
}: {
  surface: TeamSurface;
  company: string;
  query?: string;
  status?: TeamStatusFilter;
  onRetry?: () => void;
  onClearSearch?: () => void;
  onShowAll?: () => void;
}) {
  const words = teamListWords(en.t, {
    pack: IN_FORMATS,
    language: 'en',
    now: NOW,
    company,
    query,
    status,
  });
  const rows =
    surface === 'teaching'
      ? ROWS.filter((row) => row.isViewer)
      : surface === 'empty-chip'
        ? []
        : ROWS;
  return (
    <MemberList
      surface={surface}
      rows={rows}
      words={words}
      onRetry={onRetry}
      onClearSearch={onClearSearch}
      onShowAll={onShowAll}
    />
  );
}
