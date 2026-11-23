import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import type { LaidPicture } from '../../src/studio/own-picture';
import { planLaid } from '../../src/studio/own-picture-acts';

/** A plan laid on an empty design, for the own-picture tests (`T-M05-002d`). */

export const LAID: LaidPicture = {
  pictureId: '01a50000-0000-7000-8000-0000000000aa',
  at: { east: 0, north: 0 },
  turnDeg: 0,
  metresPerUnit: 0.01,
  scaleFrom: 'guess',
};
export const withPlan = (laid: Partial<LaidPicture> = {}) =>
  planLaid(EMPTY_STUDIO_DOCUMENT, { ...LAID, ...laid }, 1);
export const planOf = (laid: Partial<LaidPicture> = {}) => {
  const { plan } = withPlan(laid);
  if (plan == null) throw new Error('no plan laid');
  return plan;
};
