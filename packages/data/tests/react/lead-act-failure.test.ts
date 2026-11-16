import { describe, expect, it } from 'vitest';
import { ApiError } from '../../src/errors/errors';
import { leadActFailureOf } from '../../src/react/lead-detail-cache';

/**
 * Why an act on a lead came back undone, as the sheet says it: a lead closed under the person
 * reads as the lifecycle's own refusal, so the words say to reopen it first, never "try again".
 */
describe('leadActFailureOf', () => {
  it.each([
    ['a closed lead', 'LEAD_CLOSED', { kind: 'refused', refusal: 'lead_closed' }],
    ['a number no one may dial', 'NUMBER_NOT_DIALLABLE', { kind: 'not_diallable' }],
  ])('%s reads as its own refusal', (_what, code, failure) => {
    const error = new ApiError(422, 'refused', { code });
    expect(leadActFailureOf(error)).toEqual(failure);
  });
});
