import { describe, expect, it } from 'vitest';
import {
  actorSchema,
  effectiveSettingsSchema,
  notificationSchema,
  tenantSchema,
  uiLanguageResponseSchema,
  uiLanguageSchema,
  updateUserProfileSchema,
  userProfileSchema,
} from '../src';

/**
 * `F3-26` — adding a language is configuration, so a build older than the server must still read
 * a response naming a language it has no catalog for. A request stays closed: the server stores
 * only a language it knows.
 */
describe('a language on the wire — open where a response carries it, closed where a request does', () => {
  it('a response carries a language a newer server added', () => {
    expect(uiLanguageResponseSchema.safeParse('ta').success).toBe(true);
    expect(uiLanguageResponseSchema.safeParse('mr').success).toBe(true);
  });

  it('a request refuses a language the set does not hold', () => {
    expect(uiLanguageSchema.safeParse('ta').success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ interfaceLanguage: 'ta' }).success).toBe(false);
  });

  const id = '5b1f2d6c-3f7a-4c1e-9a55-0d6c6f1c2b10';

  it('the profile, the session, the tenant, the effective settings and a notification read with a new language', () => {
    expect(
      userProfileSchema.safeParse({
        id,
        phoneE164: '+919876543210',
        name: 'Asha',
        interfaceLanguage: 'ta',
        unitPreference: 'metric',
      }).success,
    ).toBe(true);
    expect(
      actorSchema.safeParse({
        userId: id,
        phoneE164: '+919876543210',
        displayName: 'Asha',
        interfaceLanguage: 'ta',
      }).success,
    ).toBe(true);
    expect(tenantSchema.shape.defaultLanguage.safeParse('ta').success).toBe(true);
    expect(notificationSchema.shape.language.safeParse('ta').success).toBe(true);
    expect(
      effectiveSettingsSchema.shape.locale.safeParse({
        source: 'platform',
        value: { defaultLanguage: 'ta', timezone: 'Asia/Kolkata' },
      }).success,
    ).toBe(true);
  });
});
