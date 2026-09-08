/**
 * What a device still holds for a user that has not reached the server (`F4-37`): captured
 * work waiting to upload. The sign-in flow consults it before it lets a DIFFERENT user in, so
 * the person whose work would be lost is told first. V1 holds nothing on the device — no
 * capture feature has landed — so the default answers empty; the first task that holds a
 * capture implements this and the warning gains its count.
 */
export interface HeldWorkSummary {
  readonly count: number;
  readonly capturedByUserId: string;
  readonly capturedAt: string;
}

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
