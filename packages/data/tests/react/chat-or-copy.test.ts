// @vitest-environment happy-dom
import type { ComposedMessage } from '@heliogrid/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { chatOrCopy } from '../../src/react/chat-or-copy';
import {
  type ProposalTrackMoves,
  useProposalTrackScreen,
} from '../../src/react/use-proposal-track-screen';
import { PROPOSAL } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/**
 * A market that names no chat app (`chatUri` null) still hands the words on: they are copied, and
 * the copy — or the device's refusal — is said where the person acted, never a silent no-op.
 */
const WORDS: ComposedMessage = { language: 'en', text: 'Namaste', link: null, chatUri: null };

function handOff(refuses: boolean) {
  const done = { chats: [] as ComposedMessage[], copied: [] as string[], said: [] as string[] };
  const moves = {
    openChat: (message: ComposedMessage) => void done.chats.push(message),
    copy: (text: string, copied: () => void, notCopied: () => void) => {
      if (refuses) return notCopied();
      done.copied.push(text);
      copied();
    },
  };
  const said = {
    chatted: () => void done.said.push('chatted'),
    copied: () => void done.said.push('copied'),
    notCopied: () => void done.said.push('not_copied'),
  };
  return { done, moves, said };
}

describe('chatOrCopy', () => {
  it.each<[string, string | null, boolean, string, number, number]>([
    ['a chat address opens the chat', 'https://wa.me/91990', false, 'chatted', 1, 0],
    ['no chat app copies the words', null, false, 'copied', 0, 1],
    ['no chat app, and the device refuses the copy', null, true, 'not_copied', 0, 0],
  ])('%s', (_, chatUri, refuses, saidWord, chats, copies) => {
    const { done, moves, said } = handOff(refuses);
    chatOrCopy(moves, { ...WORDS, chatUri }, said);
    expect(done.said).toEqual([saidWord]);
    expect(done.chats).toHaveLength(chats);
    expect(done.copied).toHaveLength(copies);
  });
});

describe('the track screen in a market with no chat app', () => {
  it.each<[string, boolean, string]>([
    ['Share on WhatsApp records the share and copies the words', false, 'message_copied'],
    ['a refused copy says so', true, 'not_copied'],
  ])('%s', async (_, refuses, kind) => {
    sell.chatUri = null;
    const { done, moves } = handOff(refuses);
    const track: ProposalTrackMoves = {
      toBuilder: () => undefined,
      toDocument: () => undefined,
      toVersions: () => undefined,
      toLinks: () => undefined,
      toLead: () => undefined,
      toProject: () => undefined,
      callLead: () => undefined,
      dial: () => undefined,
      openFile: () => undefined,
      toTaxNumber: () => undefined,
      ...moves,
    };
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, track), { wrapper: provided() });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    act(() => view.result.current.acts.share());
    await waitFor(() => expect(view.result.current.message.kind).toBe('ready'));
    const words = view.result.current.message;
    if (words.kind !== 'ready') throw new Error('the share words are not in');

    act(() => view.result.current.share(words.value));
    await waitFor(() => expect(view.result.current.said).toEqual({ kind }));
    expect(sell.sent.at(-1)?.body).toMatchObject({ channel: 'whatsapp' });
    expect(done.chats).toEqual([]);
  });
});
