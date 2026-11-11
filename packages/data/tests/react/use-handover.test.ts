// @vitest-environment happy-dom
import type { ProjectDetail } from '@heliogrid/contracts';
import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PACK_LOOK_MS, PACK_LOOKS, useHandover } from '../../src/react/use-handover';
import { useProjectScreen } from '../../src/react/use-project-screen';
import { useTenantId } from '../../src/react/use-tenant-id';
import { refusal } from './origin-wire';
import {
  AT,
  aProject,
  CUSTOMER_ID,
  FILE_ID,
  PREVIEW,
  PROJECT_ID,
  READER,
} from './projects-fixtures';
import { answerNext, mountedOver, origin, readsOf, settle } from './projects-origin';
import { leadDetail, PRIYA } from './quick-add-origin';

/**
 * The handover (`SCR-M08-06`) through the real client: what it checks, read only while the flow
 * is open, and the referral asked in it — a new lead referred by this customer (`M08-47`), or the
 * record the number already belongs to.
 */

const PREVIEW_PATH = `/projects/${PROJECT_ID}/handover`;
const DETAIL_PATH = `/projects/${PROJECT_ID}`;
const REFERRAL = { name: 'Meera Joshi', phoneE164: '+919822041234' };
const NEW_LEAD = '01a60000-0000-7000-8000-000000000601';

async function mountedFlow(open = true) {
  const view = mountedOver(
    ({ open: shown }: { open: boolean }) => ({
      handover: useHandover(PROJECT_ID, CUSTOMER_ID, shown),
      tenantId: useTenantId(),
    }),
    { open },
  );
  await waitFor(() => expect(view.result.current.tenantId).not.toBe(''));
  return view;
}

describe('Handover — what it checks', () => {
  it('is read only once the flow opens', async () => {
    const view = await mountedFlow(false);
    await settle();
    expect(readsOf(PREVIEW_PATH)).toBe(0);
    view.rerender({ open: true });
    await waitFor(() =>
      expect(view.result.current.handover.preview).toEqual({ kind: 'ready', value: PREVIEW }),
    );
  });
});

describe('Handover — the referral ask', () => {
  it('a new number is captured as a lead referred by this customer', async () => {
    answerNext('leads', { status: 201, body: leadDetail(NEW_LEAD, CUSTOMER_ID, REFERRAL.name) });
    const view = await mountedFlow();
    act(() => view.result.current.handover.refer(REFERRAL));
    await waitFor(() => expect(view.result.current.handover.referred).toBe(REFERRAL.name));
    expect(origin.writes).toEqual([
      {
        path: '/leads',
        body: {
          ...REFERRAL,
          referredBy: { customerId: CUSTOMER_ID },
          capturedAt: expect.any(String),
        },
        key: expect.any(String),
      },
    ]);
    expect(view.result.current.handover.referralKnown).toBeNull();
    expect(view.result.current.handover.referralFailed).toBe(false);
    expect(view.result.current.handover.referring).toBe(false);
  });

  it('a number someone already has makes nothing new and says it is known', async () => {
    answerNext('leads', {
      status: 409,
      body: { error: { ...refusal('DUPLICATE_PHONE').error, facts: PRIYA } },
    });
    const view = await mountedFlow();
    act(() => view.result.current.handover.refer(REFERRAL));
    await waitFor(() =>
      expect(view.result.current.handover.referralKnown).toBe(REFERRAL.phoneE164),
    );
    expect(view.result.current.handover.referred).toBeNull();
    expect(view.result.current.handover.referralFailed).toBe(false);
  });

  it('a capture that fails says so and names no one', async () => {
    const view = await mountedFlow();
    act(() => view.result.current.handover.refer(REFERRAL));
    await waitFor(() => expect(view.result.current.handover.referralFailed).toBe(true));
    expect(view.result.current.handover.referred).toBeNull();
    expect(view.result.current.handover.referralKnown).toBeNull();
  });
});

/** The project handed over, its pack's row filled by the server — or still empty. */
function handedOver(packed: boolean): ProjectDetail {
  const project = aProject();
  const file = {
    id: FILE_ID,
    fileId: FILE_ID,
    name: 'Handover pack.pdf',
    contentType: 'application/pdf',
    addedAt: AT,
    addedBy: READER,
    shownToCustomer: true,
  };
  project.stage = 'handed_over';
  project.documents = [
    {
      row: 'handover_pack',
      state: packed ? 'done' : 'pending',
      reason: null,
      movesTo: null,
      madeBy: 'handover',
      changedAt: AT,
      changedBy: null,
      files: packed ? [file] : [],
    },
  ];
  return project;
}

describe('Handover — read again after the project changes', () => {
  it.each([
    [
      'a row marked not needed',
      { kind: 'notNeeded', row: 'signed_proposal', reason: 'Signed on paper' },
    ],
    ['a stage move', { kind: 'move', to: 'material_ordered' }],
  ] as const)('after %s, what still waits is read again', async (_, sent) => {
    const view = mountedOver(() => ({
      screen: useProjectScreen(PROJECT_ID),
      handover: useHandover(PROJECT_ID, CUSTOMER_ID, true),
    }));
    await waitFor(() => expect(view.result.current.handover.preview.kind).toBe('ready'));
    await waitFor(() => expect(view.result.current.screen.read.kind).toBe('ready'));
    const before = readsOf(PREVIEW_PATH);
    act(() => view.result.current.screen.send(sent));
    await waitFor(() => expect(readsOf(PREVIEW_PATH)).toBeGreaterThan(before));
  });
});

describe('Handover — the pack', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('before the handover is what it will hold, and nothing is looked for', async () => {
    const view = await mountedFlow();
    await waitFor(() => expect(view.result.current.handover.preview.kind).toBe('ready'));
    expect(view.result.current.handover.pack).toEqual({ kind: 'unmade', files: 2 });
    expect(view.result.current.handover.handedOver).toBe(false);
    const reads = readsOf(DETAIL_PATH);
    await settle();
    expect(readsOf(DETAIL_PATH)).toBe(reads);
  });

  it(
    'once handed over, is looked for again until the server puts it on its row',
    async () => {
      origin.project = handedOver(false);
      const view = await mountedFlow();
      await waitFor(() => expect(view.result.current.handover.pack.kind).toBe('making'));
      origin.project = handedOver(true);
      await waitFor(
        () =>
          expect(view.result.current.handover.pack).toEqual({
            kind: 'ready',
            files: 2,
            leftOut: 0,
            fileId: FILE_ID,
          }),
        { timeout: PACK_LOOK_MS * 2 },
      );
    },
    PACK_LOOK_MS * 3,
  );

  it('made with a file it could not read, is ready and names the file left out', async () => {
    origin.project = { ...handedOver(true), packLeftOut: 1 };
    const view = await mountedFlow();
    await waitFor(() =>
      expect(view.result.current.handover.pack).toEqual({
        kind: 'ready',
        files: 1,
        leftOut: 1,
        fileId: FILE_ID,
      }),
    );
  });

  it('made with no file it could read, is unreadable, and is looked for no more', async () => {
    origin.project = { ...handedOver(false), packLeftOut: 2 };
    const view = await mountedFlow();
    await waitFor(() =>
      expect(view.result.current.handover.pack).toEqual({ kind: 'unreadable', files: 2 }),
    );
    const reads = readsOf(DETAIL_PATH);
    await settle();
    expect(readsOf(DETAIL_PATH)).toBe(reads);
  });

  it('is late after its looks, stops looking, and looks again when asked', async () => {
    vi.useFakeTimers({
      toFake: ['setInterval', 'clearInterval', 'Date'],
      shouldAdvanceTime: true,
    });
    origin.project = handedOver(false);
    const view = await mountedFlow();
    await waitFor(() => expect(view.result.current.handover.pack.kind).toBe('making'));
    const first = readsOf(DETAIL_PATH);
    const look = () =>
      act(async () => {
        vi.advanceTimersByTime(PACK_LOOK_MS);
        await settle();
      });
    for (let looked = 1; looked <= PACK_LOOKS; looked += 1) {
      await look();
      expect(readsOf(DETAIL_PATH)).toBe(first + looked);
    }
    expect(view.result.current.handover.pack).toEqual({ kind: 'late', files: 2 });
    await look();
    expect(readsOf(DETAIL_PATH)).toBe(first + PACK_LOOKS);
    origin.project = handedOver(true);
    act(() => view.result.current.handover.lookAgain());
    await waitFor(() => expect(view.result.current.handover.pack.kind).toBe('ready'));
  });
});
