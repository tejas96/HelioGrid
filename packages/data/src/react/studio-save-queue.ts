import type { MemberRef, SavedDocument } from '@heliogrid/contracts';
import type { StudioDocument } from '@heliogrid/domain';
import { aKey } from '../client/creation-key';
import { DataError, isUnanswered } from '../errors/errors';
import { DesignActRefusedError, DocumentConflictError } from '../studio/studio-repository';

/**
 * Where the design's saving stands, as the Saved pill says it. `offline`: no connection, the change
 * waits and goes when the connection returns. `failed`: the api answered but did not save; the
 * change waits for a retry. The last four stop the queue: someone saved first, another person
 * holds the turn, the design's lead takes no more change, or the api refused the reader outright —
 * their right to edit or to see the design is gone.
 */
export type StudioSaveState =
  | { readonly kind: 'saved' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'offline' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'saved-first'; readonly savedBy: MemberRef | null; readonly savedAt: string }
  | { readonly kind: 'turn-held'; readonly editor: MemberRef }
  | { readonly kind: 'closed' }
  | { readonly kind: 'refused' };

interface QueueWiring {
  /** Sends one save, made by `opening` — this studio opening's own random id. */
  send(baseVersion: number, document: StudioDocument, opening: string): Promise<SavedDocument>;
  online(): boolean;
  changed(state: StudioSaveState): void;
}

/**
 * The design's one save queue: each change is saved the moment it is made, one save at a time,
 * the newest document winning over any still waiting. Nothing is kept on the device (`F4`): a
 * change that could not go waits in memory and goes when the connection returns.
 */
export class StudioSaveQueue {
  private version = 0;
  private waiting: StudioDocument | null = null;
  private sending = false;
  private stopped = false;
  /** This opening of the studio: the api names it when a save that came first was its own. */
  private readonly opening = aKey();
  private settledWaiters: (() => void)[] = [];

  constructor(private readonly wiring: QueueWiring) {}

  /** The version the document was read at; a new read starts the queue again. */
  start(version: number): void {
    this.version = version;
    this.waiting = null;
    this.stopped = false;
    this.changed({ kind: 'saved' });
  }

  /** Whether a change still waits to be saved. */
  get unsaved(): boolean {
    return !this.stopped && (this.waiting !== null || this.sending);
  }

  /** Resolves once nothing waits or is out — at once when nothing does. */
  settled(): Promise<void> {
    if (!this.unsaved) return Promise.resolve();
    return new Promise((resolve) => this.settledWaiters.push(resolve));
  }

  private changed(state: StudioSaveState): void {
    this.wiring.changed(state);
    if (!this.unsaved) for (const resolve of this.settledWaiters.splice(0)) resolve();
  }

  put(document: StudioDocument): void {
    if (this.stopped) return;
    this.waiting = document;
    void this.flush();
  }

  async flush(): Promise<void> {
    if (this.sending || this.stopped || this.waiting === null) return;
    if (!this.wiring.online()) {
      this.changed({ kind: 'offline' });
      return;
    }
    const document = this.waiting;
    this.waiting = null;
    this.sending = true;
    this.changed({ kind: 'saving' });
    try {
      const saved = await this.wiring.send(this.version, document, this.opening);
      this.version = saved.version;
      this.sending = false;
      if (this.waiting === null) this.changed({ kind: 'saved' });
      else void this.flush();
    } catch (error) {
      this.sending = false;
      this.failed(error, document);
    }
  }

  private failed(error: unknown, document: StudioDocument): void {
    if (error instanceof DocumentConflictError) {
      const { conflict } = error;
      if (conflict.kind === 'saved-first' && conflict.byThisOpening) {
        // This opening's own save landed while its answer was lost: go on from it. The same person
        // saving from another device is another opening — a conflict like any other.
        this.version = conflict.version;
        this.waiting ??= document;
        void this.flush();
        return;
      }
      this.stopped = true;
      this.waiting = null;
      this.changed(
        conflict.kind === 'saved-first'
          ? { kind: 'saved-first', savedBy: conflict.savedBy, savedAt: conflict.savedAt }
          : { kind: 'turn-held', editor: conflict.editor },
      );
      return;
    }
    if (error instanceof DesignActRefusedError) {
      this.stopped = true;
      this.waiting = null;
      this.changed({ kind: 'closed' });
      return;
    }
    if (isUnanswered(error)) {
      this.waiting ??= document;
      this.changed({ kind: 'offline' });
      return;
    }
    if (error instanceof DataError && error.retryable) {
      this.waiting ??= document;
      this.changed({ kind: 'failed' });
      return;
    }
    // Refused outright — the right to edit or to see the design is gone: no retry can land.
    this.stopped = true;
    this.waiting = null;
    this.changed({ kind: 'refused' });
  }
}
