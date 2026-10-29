import {
  IN_FORMATS,
  opensAssignRoles,
  type Read,
  type TeamList,
  type TeamStatusFilter,
  type TeamSurface,
  teamRoster,
  teamRosterView,
} from '@heliogrid/domain';
import { createTranslator, teamActWords, teamListWords } from '@heliogrid/i18n';
import { MemberAct, MemberList, memberActOf } from '@heliogrid/ui';
import { useState } from 'react';

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
    {
      membershipId: 'm-2',
      userId: 'u-vikram',
      name: 'Vikram Deshpande',
      phoneE164: '+919800000002',
      roles: ['survey_engineer', 'design_engineer'],
      status: 'active',
      lastActiveAt: '2026-08-30T10:00:00Z',
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
  withActs = false,
  withOpen = false,
}: {
  /** The read's wait or failure, or the body its value draws. */
  surface: 'loading' | 'failed' | TeamSurface;
  company: string;
  query?: string;
  status?: TeamStatusFilter;
  onRetry?: () => void;
  onClearSearch?: () => void;
  onShowAll?: () => void;
  /** Each card's act, as both screens draw it. */
  withActs?: boolean;
  /** Each card opens the person when Assign Roles may: the frame reports it as `data-opened`. */
  withOpen?: boolean;
}) {
  const [opened, setOpened] = useState('');
  const [acted, setActed] = useState('');
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
  const read: Read<TeamList> =
    surface === 'loading'
      ? { kind: 'loading' }
      : surface === 'failed'
        ? { kind: 'failed', failure: 'no_answer', retry: onRetry }
        : { kind: 'ready', value: { view: { ...teamRosterView(ROWS, '', 'all'), rows }, surface } };
  const acts = teamActWords(en.t, company);
  return (
    <div data-opened={opened} data-acted={acted}>
      <MemberList
        {...(withActs
          ? {
              actOf: (row) => {
                const act = memberActOf(row, ROWS, acts, () => false);
                return act === null ? null : (
                  <MemberAct {...act} size="md" fullWidth onPress={() => setActed(row.name)} />
                );
              },
            }
          : {})}
        read={read}
        words={words}
        focusAfter={{ current: null }}
        onClearSearch={onClearSearch}
        onShowAll={onShowAll}
        openOf={
          withOpen
            ? (row) => (opensAssignRoles(row) ? () => setOpened(row.name) : undefined)
            : undefined
        }
      />
    </div>
  );
}
