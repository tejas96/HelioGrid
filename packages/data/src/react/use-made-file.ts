'use client';
import type { FileDownload } from '@heliogrid/contracts';
import type { ReadFailure } from '@heliogrid/domain';
import { type QueryKey, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { recordReadOf } from './read';

/**
 * How often, and how many times, a file the server is still making is asked for again before the
 * screen says it is late and offers its retry. A PDF is printed a few seconds after it is first
 * asked for; past half a minute the renderer is behind, and asking on would only spend the
 * person's data.
 */
export const MADE_FILE_LOOK_MS = 3000;
export const MADE_FILE_LOOKS = 10;
const WAIT_MS = MADE_FILE_LOOK_MS * MADE_FILE_LOOKS;

/**
 * A signed download address dies at its `expiresAt` (`FILE_DOWNLOAD_LINK_SECONDS`); one this close
 * to it is asked for again, so the device's clock running a little behind and the fetch's own time
 * never open an address the store already refuses.
 */
export const DOWNLOAD_EXPIRY_MARGIN_MS = 30_000;

/** The address still works now, with the margin to spare. */
function alive(download: FileDownload, now: number): boolean {
  return Date.parse(download.expiresAt) - DOWNLOAD_EXPIRY_MARGIN_MS > now;
}

/** A file the server makes on first ask (`M06-51`, `F5-39`): a proposal version's PDF. */
export type MadeFile =
  /** Nobody asked for it yet. */
  | { readonly kind: 'idle' }
  | { readonly kind: 'making' }
  | { readonly kind: 'made'; readonly download: FileDownload }
  /** Still not there after the wait: `lookAgain` waits as long again. */
  | { readonly kind: 'late' }
  /** The ask itself got no answer, or a refusal: `lookAgain` asks again. */
  | { readonly kind: 'unread'; readonly failure: ReadFailure };

export interface MadeFileRead {
  readonly file: MadeFile;
  /** Asks for the file: the first ask starts its making. */
  ask(): void;
  /** Looks for a late or failed file again, for as long as the first wait. */
  lookAgain(): void;
  /**
   * Opens the file: at once while its address lives, else once a fresh one is answered — asking
   * for it, or looking again, as needed. One tap; a file still being made opens when it is there.
   */
  get(open: (url: string) => void): void;
}

/**
 * A read that answers the file, or `null` while it is being made — asked again every
 * `MADE_FILE_LOOK_MS` from its first `null`, `MADE_FILE_LOOKS` times. The wait is measured by the
 * answers themselves, as the handover pack's is. Nothing is read until `ask`.
 */
export function useMadeFile(
  queryKey: QueryKey,
  read: (signal: AbortSignal) => Promise<FileDownload | null>,
  enabled: boolean,
): MadeFileRead {
  const [asked, setAsked] = useState(false);
  const [lookedFrom, setLookedFrom] = useState<number | null>(null);
  const looksLeft = (answeredAt: number) =>
    lookedFrom === null || answeredAt - lookedFrom < WAIT_MS;
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => read(signal),
    enabled: enabled && asked,
    // A link dies in minutes: a file asked for again later is read again.
    staleTime: 0,
    refetchInterval: (state) =>
      state.state.data === null && looksLeft(state.state.dataUpdatedAt) ? MADE_FILE_LOOK_MS : false,
  });
  const making = query.data === null;
  const wanted = useRef<((url: string) => void) | null>(null);
  useEffect(() => {
    if (making && lookedFrom === null) setLookedFrom(query.dataUpdatedAt);
  }, [making, lookedFrom, query.dataUpdatedAt]);

  const fileOf = (): MadeFile => {
    if (!asked) return { kind: 'idle' };
    const answered = recordReadOf(query);
    if (answered.kind === 'failed') return { kind: 'unread', failure: answered.failure };
    if (answered.kind === 'ready' && answered.value !== null) {
      // A dead address is no file: the next `get` asks for a fresh one.
      return alive(answered.value, Date.now())
        ? { kind: 'made', download: answered.value }
        : { kind: 'making' };
    }
    return making && !looksLeft(query.dataUpdatedAt) ? { kind: 'late' } : { kind: 'making' };
  };
  const file = fileOf();
  const madeUrl = file.kind === 'made' ? file.download.url : null;
  useEffect(() => {
    if (madeUrl === null || wanted.current === null) return;
    const open = wanted.current;
    wanted.current = null;
    open(madeUrl);
  }, [madeUrl]);
  const lookAgain = () => {
    setLookedFrom(Date.now());
    void query.refetch();
  };
  return {
    file,
    ask: () => setAsked(true),
    lookAgain,
    get: (open) => {
      // Read at the tap, never from the last render: an address can die between the two.
      const held = query.data;
      if (asked && held != null && alive(held, Date.now())) {
        open(held.url);
        return;
      }
      wanted.current = open;
      if (asked) lookAgain();
      else setAsked(true);
    },
  };
}
