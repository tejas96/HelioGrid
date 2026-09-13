/**
 * Reading what a device still holds for a user that has not reached the server (`F4-37`). The
 * SHAPE is domain's — both platforms branch on it — and this is the port that fetches it, which
 * is why it stays here: `packages/domain` holds no storage.
 */
import type { HeldWorkSummary } from '@heliogrid/domain';

export interface HeldWork {
  summary(): Promise<HeldWorkSummary | null>;
  discard(): Promise<void>;
}

export const NO_HELD_WORK: HeldWork = {
  async summary() {
    return null;
  },
  async discard() {},
};
