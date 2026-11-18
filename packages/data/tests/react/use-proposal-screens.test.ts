// @vitest-environment happy-dom
import type { ComposedMessage } from '@heliogrid/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNewProposalFlow } from '../../src/react/use-new-proposal-flow';
import {
  type ProposalTrackMoves,
  useProposalTrackScreen,
} from '../../src/react/use-proposal-track-screen';
import { nowhere, recorded } from './proposal-page-moves';
import { DESIGN, LEAD, PROPOSAL, proposalDetail, proposalRow } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/**
 * The proposal screens' view models through the real client (`T-M06-018`, `T-M06-019`,
 * `T-M06-001`): a first share hands off on its answer — the link exists only then — a draft opens in
 * the builder and any other proposal on its own page, and a proposal started for a home lead starts
 * in Quick mode.
 */

interface Performed {
  chats: ComposedMessage[];
  copied: string[];
  opened: string[];
  /** The device refuses the clipboard. */
  refuses?: boolean;
}

function trackMoves(performed: Performed): ProposalTrackMoves {
  const to = (place: string) => (id: string) => void performed.opened.push(`${place}:${id}`);
  return {
    toBuilder: to('builder'),
    toDocument: to('document'),
    toVersions: to('versions'),
    toLinks: to('links'),
    toLead: to('lead'),
    toProject: to('project'),
    callLead: to('call'),
    dial: (phoneE164) => void performed.opened.push(`dial:${phoneE164}`),
    openChat: (message) => void performed.chats.push(message),
    copy: (text, copied, notCopied) => {
      if (performed.refuses === true) return notCopied();
      performed.copied.push(text);
      copied();
    },
    openFile: (url) => void performed.opened.push(`file:${url}`),
    toTaxNumber: () => void performed.opened.push('tax'),
  };
}

const nothing = (): Performed => ({ chats: [], copied: [], opened: [] });

describe('the track screen — a share is the act itself, and hands off on its answer', () => {
  it('the first Share on WhatsApp records the share, then opens the chat with the link in the words', async () => {
    const performed = nothing();
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(performed)), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    act(() => view.result.current.acts.share());
    await waitFor(() => expect(view.result.current.message.kind).toBe('ready'));
    const words = view.result.current.message;
    if (words.kind !== 'ready') throw new Error('the share words are not in');
    // Before the first share the words hold the link's slot: nothing is handed off on them.
    expect(words.value.link).toBeNull();

    act(() => view.result.current.share(words.value));
    expect(performed.chats).toEqual([]);
    await waitFor(() => expect(performed.chats).toHaveLength(1));

    expect(performed.chats[0]?.link).toBe('https://app.heliogrid.in/p/abc');
    expect(sell.sent.at(-1)?.body).toMatchObject({ channel: 'whatsapp' });
    expect(view.result.current.said).toEqual({ kind: 'shared', followUpOn: '2026-11-15' });
    expect(view.result.current.sheet).toBeNull();
  });

  it('Copy link records the share and puts the link itself on the clipboard', async () => {
    const performed = nothing();
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(performed)), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    act(() => view.result.current.acts.share());
    await waitFor(() => expect(view.result.current.message.kind).toBe('ready'));
    const words = view.result.current.message;
    if (words.kind !== 'ready') throw new Error('the share words are not in');

    act(() => view.result.current.copy(words.value));
    await waitFor(() => expect(performed.copied).toEqual(['https://app.heliogrid.in/p/abc']));

    expect(sell.sent.at(-1)?.body).toMatchObject({ channel: 'copy_link' });
    expect(view.result.current.said).toEqual({ kind: 'link_copied', followUpOn: '2026-11-15' });
  });

  it('a copy the device refuses says so where the person acted, and the share still stands', async () => {
    const performed: Performed = { ...nothing(), refuses: true };
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(performed)), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    act(() => view.result.current.acts.share());
    await waitFor(() => expect(view.result.current.message.kind).toBe('ready'));
    const words = view.result.current.message;
    if (words.kind !== 'ready') throw new Error('the share words are not in');

    act(() => view.result.current.copy(words.value));
    await waitFor(() => expect(view.result.current.said).toEqual({ kind: 'not_copied' }));
    expect(performed.copied).toEqual([]);
  });

  it('each hero act does its one thing: a draft continues in the builder, a win is confirmed on the lead', async () => {
    const performed = nothing();
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(performed)), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    act(() => view.result.current.acts.continue());
    act(() => view.result.current.acts.confirm_won());
    act(() => view.result.current.acts.call());

    expect(performed.opened).toEqual([`builder:${PROPOSAL}`, `lead:${LEAD}`, 'dial:+919850012345']);
  });

  it('the cover and the summary show the version sent, never a later draft edit (M06-43)', async () => {
    const sent = proposalDetail({ priceInclusive: '190575.00', status: 'shared' });
    const summary = {
      version: 1,
      generatedAt: '2026-11-13T06:00:00.000Z',
      generatedBy: null,
      trigger: 'first_generate',
      changeNote: null,
      payable: '190575.00',
      sharedAt: '2026-11-13T06:05:00.000Z',
      answer: null,
      answeredAt: null,
      onLink: true,
      inForce: false,
    };
    sell.versions = [{ ...summary, proposalId: PROPOSAL, document: sent.document, diff: null }];
    sell.proposal = {
      ...proposalDetail({ priceInclusive: '250000.00', status: 'shared', standing: 'opened' }),
      versions: [summary],
    };
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(nothing())), {
      wrapper: provided(),
    });

    await waitFor(() => expect(view.result.current.shown.kind).toBe('ready'));
    const { shown } = view.result.current;
    expect(shown.kind === 'ready' ? shown.value.money?.payable.amount : null).toBe('190575.00');
  });

  it('a draft never generated shows its own live document', async () => {
    sell.proposal = proposalDetail({ priceInclusive: '250000.00' });
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(nothing())), {
      wrapper: provided(),
    });

    await waitFor(() => expect(view.result.current.shown.kind).toBe('ready'));
    const { shown } = view.result.current;
    expect(shown.kind === 'ready' ? shown.value.money?.payable.amount : null).toBe('250000.00');
  });

  it('Call opens the lead, never the dialler, for a customer who may not be called (M02-44)', async () => {
    sell.proposal = proposalDetail({ standing: 'opened', status: 'shared', canDial: false });
    const performed = nothing();
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, trackMoves(performed)), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    act(() => view.result.current.acts.call());

    expect(performed.opened).toEqual([`call:${LEAD}`]);
  });
});

describe('New proposal — a lead first, then the start sheet, then the builder', () => {
  it.each([
    ['a home lead picks Quick first', 'residential', 'residential', 'quick', true],
    ['a business lead picks Full first', 'commercial', 'commercial', 'full', false],
    ['a lead whose kind is not known picks Full first', null, null, 'full', false],
    [
      'an existing home lead the capture named without its kind picks Quick',
      null,
      'residential',
      'quick',
      true,
    ],
  ] as const)('%s', async (_, hint, held, mode, quickMode) => {
    sell.leadSegment = held;
    const built: string[] = [];
    const view = renderHook(
      () => useNewProposalFlow({ ...nowhere(), toBuilder: (id) => void built.push(id) }),
      {
        wrapper: provided(),
      },
    );
    act(() => view.result.current.openNew());
    expect(view.result.current.stage).toBe('capture');

    act(() => view.result.current.startOn(LEAD, hint));
    expect(view.result.current.stage).toBe('start');
    expect(view.result.current.start.open).toBe(true);
    await waitFor(() => expect(view.result.current.customerName).not.toBeNull());
    expect(view.result.current.start.mode).toBe(mode);
    expect(sell.sent).toEqual([]);

    act(() => view.result.current.start.go());
    await waitFor(() => expect(built).toEqual([PROPOSAL]));

    expect(sell.sent.at(-1)?.body).toMatchObject({ quickMode, copyOf: null });
    expect(view.result.current.stage).toBeNull();
  });

  it('one tap changes the mode the lead picked first', async () => {
    const built: string[] = [];
    const view = renderHook(
      () => useNewProposalFlow({ ...nowhere(), toBuilder: (id) => void built.push(id) }),
      {
        wrapper: provided(),
      },
    );
    act(() => view.result.current.openNew());
    act(() => view.result.current.startOn(LEAD, 'residential'));
    act(() => view.result.current.start.setMode('full'));
    act(() => view.result.current.start.go());
    await waitFor(() => expect(built).toEqual([PROPOSAL]));
    expect(sell.sent.at(-1)?.body).toMatchObject({ quickMode: false });
  });

  it('With 3D design makes the lead’s design and opens its Site details, with no proposal', async () => {
    const opened: string[] = [];
    const view = renderHook(() => useNewProposalFlow(recorded(opened)), { wrapper: provided() });
    act(() => view.result.current.openNew());
    act(() => view.result.current.startOn(LEAD, 'residential'));
    // The design grant is read from the session, once it is in.
    await waitFor(() => expect(view.result.current.start.canDesign).toBe(true));
    act(() => view.result.current.start.setMode('design'));
    act(() => view.result.current.start.go());
    await waitFor(() => expect(opened).toEqual([`site:${DESIGN}`]));

    expect(sell.sent.map((write) => write.path)).toEqual([`/leads/${LEAD}/designs`]);
    expect(sell.sent.at(-1)?.body).toMatchObject({ copyOf: null });
    expect(sell.sent.at(-1)?.key).toEqual(expect.any(String));
    expect(view.result.current.stage).toBeNull();
  });

  it('closing the start sheet starts nothing', () => {
    const view = renderHook(() => useNewProposalFlow(nowhere()), {
      wrapper: provided(),
    });
    act(() => view.result.current.openNew());
    act(() => view.result.current.startOn(LEAD, 'residential'));
    act(() => view.result.current.start.close());
    expect(view.result.current.stage).toBeNull();
    expect(sell.sent).toEqual([]);
  });

  it('closing the capture starts nothing', () => {
    const built: string[] = [];
    const view = renderHook(
      () => useNewProposalFlow({ ...nowhere(), toBuilder: (id) => void built.push(id) }),
      {
        wrapper: provided(),
      },
    );
    act(() => view.result.current.openNew());

    act(() => view.result.current.close());

    expect(view.result.current.stage).toBeNull();
    expect(sell.sent).toEqual([]);
    expect(built).toEqual([]);
  });

  it('a copy carries its source to the lead picked', async () => {
    const built: string[] = [];
    const view = renderHook(
      () => useNewProposalFlow({ ...nowhere(), toBuilder: (id) => void built.push(id) }),
      {
        wrapper: provided(),
      },
    );
    const source = proposalRow('01a30000-0000-7000-8000-00000000b009', 'shared');
    act(() => view.result.current.openCopy(source));
    expect(view.result.current.stage).toBe('pick');

    act(() => view.result.current.startOn(LEAD, 'residential'));
    await waitFor(() => expect(built).toEqual([PROPOSAL]));

    expect(sell.sent.at(-1)?.body).toMatchObject({ copyOf: source.id });
  });
});
