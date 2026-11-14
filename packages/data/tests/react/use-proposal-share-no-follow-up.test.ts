// @vitest-environment happy-dom
import type { ComposedMessage } from '@heliogrid/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposalShare } from '../../src/react/use-proposal-share';
import {
  type ProposalTrackMoves,
  useProposalTrackScreen,
} from '../../src/react/use-proposal-track-screen';
import { PROPOSAL } from './proposals-fixtures';
import { provided } from './proposals-origin';
import { originActs } from './proposals-origin-acts';

/**
 * A share that raised no follow-up (`followUpOn: null` — a share again of an answered version),
 * through the real client: the hook and the track screen hand the `null` on as it came, so the
 * toast says only that it was shared (`shareToastWords`, `packages/i18n/tests/share-toast.test.ts`)
 * and never a day nobody set.
 */

/** The track screen's moves: the chat and the clipboard are recorded, every other way out is inert. */
function moves(chats: ComposedMessage[]): ProposalTrackMoves {
  const inert = () => undefined;
  return new Proxy({} as ProposalTrackMoves, {
    get: (_, move) => {
      if (move === 'openChat') return (message: ComposedMessage) => void chats.push(message);
      if (move === 'copy') return (_text: string, copied: () => void) => copied();
      return inert;
    },
  });
}

describe('a share with no follow-up names no day', () => {
  it('the share hook answers the link with no follow-up', async () => {
    originActs.followUpOn = null;
    const view = renderHook(() => useProposalShare(PROPOSAL, { share: true, acceptance: false }), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.message?.kind).toBe('ready'));

    act(() => view.result.current.share('whatsapp'));

    await waitFor(() => expect(view.result.current.shared).not.toBeNull());
    expect(view.result.current.shared?.followUpOn).toBeNull();
  });

  it.each([
    ['whatsapp', 'shared'],
    ['copy_link', 'link_copied'],
  ] as const)('the track screen’s %s says %s with no day', async (channel, said) => {
    originActs.followUpOn = null;
    const chats: ComposedMessage[] = [];
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, moves(chats)), {
      wrapper: provided(),
    });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    act(() => view.result.current.acts.share());
    await waitFor(() => expect(view.result.current.message.kind).toBe('ready'));
    const words = view.result.current.message;
    if (words.kind !== 'ready') throw new Error('the share words are not in');

    act(() =>
      channel === 'whatsapp'
        ? view.result.current.share(words.value)
        : view.result.current.copy(words.value),
    );

    await waitFor(() => expect(view.result.current.said).toEqual({ kind: said, followUpOn: null }));
  });
});
