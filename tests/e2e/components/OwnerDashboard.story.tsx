import type { OwnerDashboard as Dashboard } from '@heliogrid/contracts';
import { needsYouKindsOf, type UiLanguage, winRateOf } from '@heliogrid/domain';
import { createTranslator, ownerDashboardWords, provenanceWords } from '@heliogrid/i18n';
import { type NeedOpen, OwnerDashboard, ProvenanceWordsProvider } from '@heliogrid/ui';
import { useRef, useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** Suryodaya Solar on 12 November: four leads unassigned… every need waiting. */
const BUSY: Dashboard = {
  scope: 'company',
  today: '2026-11-12',
  month: '2026-11',
  currencyCode: 'INR',
  needsYou: {
    unassigned: { count: 2, oldestHours: 26 },
    paymentsLate: {
      count: 3,
      amount: '185000.00',
      oldestDays: 12,
      oldestProjectId: '00000000-0000-4000-8000-000000000011',
    },
    blockedOnUs: {
      count: 1,
      oldest: { projectId: '00000000-0000-4000-8000-000000000021', name: 'Patil Farms', days: 6 },
    },
    waitingLongest: [
      {
        leadId: '00000000-0000-4000-8000-000000000031',
        name: 'Kavita Joshi',
        stage: 'proposal',
        days: 34,
      },
    ],
    myOverdueTasks: 4,
  },
  cash: {
    collectedThisMonth: '1840000.00',
    collectedLastMonth: '1640000.00',
    toCollect: '620000.00',
    late: { count: 3, amount: '185000.00' },
  },
  won: {
    thisMonth: { count: 6, amount: '2460000.00' },
    lastMonth: { count: 5, amount: '2100000.00' },
    median: { amount: '610000.00', of: 14 },
  },
  target: { amount: '3000000.00' },
  canSetTarget: true,
  pipeline: [
    { stage: 'new', count: 12 },
    { stage: 'contacted', count: 9 },
    { stage: 'qualified', count: 7 },
    { stage: 'survey', count: 6 },
    { stage: 'design', count: 4 },
    { stage: 'proposal', count: 3 },
    { stage: 'negotiating', count: 2 },
  ],
  winLoss: {
    windowDays: 90,
    won: 13,
    lost: 29,
    lostReasons: [
      { reason: 'chose_competitor', count: 5 },
      { reason: 'price', count: 9 },
      { reason: 'postponed', count: 6 },
      { reason: 'roof_unsuitable', count: 4 },
      { reason: 'not_reachable', count: 3 },
    ],
  },
};

const QUIET: Dashboard = {
  ...BUSY,
  scope: 'team',
  needsYou: {
    unassigned: { count: 0, oldestHours: null },
    paymentsLate: { count: 0, amount: '0.00', oldestDays: null, oldestProjectId: null },
    blockedOnUs: { count: 0, oldest: null },
    waitingLongest: [],
    myOverdueTasks: 0,
  },
  cash: { ...BUSY.cash, late: { count: 0, amount: '0.00' } },
  target: null,
  canSetTarget: false,
  winLoss: { windowDays: 90, won: 2, lost: 0, lostReasons: [] },
  won: { ...BUSY.won, median: null },
};

export type DashboardFrame = 'busy' | 'quiet' | 'no-target' | 'loading' | 'failed';

const VIEW: Record<'busy' | 'quiet' | 'no-target', Dashboard> = {
  busy: BUSY,
  quiet: QUIET,
  'no-target': { ...BUSY, target: null },
};

/**
 * The dashboard as the owner home holds it. What it reports: the last need opened (`data-opened`),
 * the last target sent (`data-target`, `none` for a clear), and exports and retries as counts.
 */
export function OwnerDashboardAsRead({
  frame,
  reader = 'en',
  failSave = false,
}: {
  frame: DashboardFrame;
  reader?: UiLanguage;
  failSave?: boolean;
}) {
  const { t } = READERS[reader];
  const [opened, setOpened] = useState<NeedOpen | null>(null);
  const [sent, setSent] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [exports, setExports] = useState(0);
  const [retries, setRetries] = useState(0);
  const focus = useRef<HTMLDivElement>(null);
  const view = frame === 'loading' || frame === 'failed' ? null : VIEW[frame];
  const read =
    frame === 'loading'
      ? ({ kind: 'loading' } as const)
      : frame === 'failed'
        ? ({ kind: 'failed', failure: 'refused', retry: () => setRetries((n) => n + 1) } as const)
        : ({ kind: 'ready', value: view ?? BUSY } as const);
  const counts = view?.needsYou;
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <div
        ref={focus}
        tabIndex={-1}
        lang={reader}
        data-opened={opened === null ? '' : JSON.stringify(opened)}
        data-target={sent === undefined ? '' : (sent ?? 'none')}
        data-exports={exports}
        data-retries={retries}
        style={{ padding: 16 }}
      >
        <OwnerDashboard
          read={read}
          words={ownerDashboardWords(t)}
          needsYou={
            counts === undefined
              ? []
              : needsYouKindsOf({
                  unassigned: counts.unassigned.count,
                  paymentsLate: counts.paymentsLate.count,
                  blockedOnUs: counts.blockedOnUs.count,
                  waitingLongest: counts.waitingLongest.length,
                  myOverdueTasks: counts.myOverdueTasks,
                })
          }
          winRate={view === null ? null : winRateOf(view.winLoss.won, view.winLoss.lost)}
          onNeed={setOpened}
          onSetTarget={(amount) => {
            setSent(amount);
            setSaving(true);
            setFailed(false);
            setTimeout(() => {
              setSaving(false);
              setFailed(failSave);
            }, 300);
          }}
          targetSaving={saving}
          targetFailed={failed}
          onExport={() => setExports((n) => n + 1)}
          focusAfter={focus}
        />
      </div>
    </ProvenanceWordsProvider>
  );
}
