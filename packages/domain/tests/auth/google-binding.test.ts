import { describe, expect, it } from 'vitest';
import { type GoogleBindingRoad, googleBindingRoad } from '../../src/auth/google-binding';

const PHONE = '+919820041123';
const OTHER = '+919820041124';

describe('googleBindingRoad', () => {
  it.each<[string, string | null, string | null, GoogleBindingRoad]>([
    ['a linked login with no phone named signs in', PHONE, null, 'session'],
    ['a linked login naming its own phone signs in', PHONE, PHONE, 'session'],
    ['a linked login naming another phone is refused', PHONE, OTHER, 'subject-taken'],
    ['an unlinked login with no phone named runs the phone step', null, null, 'not-linked'],
    ['an unlinked login naming a phone binds once its code matches', null, PHONE, 'bind'],
  ])('%s', (_, linkedPhoneE164, requestedPhoneE164, road) => {
    expect(googleBindingRoad({ linkedPhoneE164, requestedPhoneE164 })).toBe(road);
  });
});
