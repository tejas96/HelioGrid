import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { measurementSystemSchema, phoneE164Schema, uuidSchema } from './common';
import { baseError, errorEnvelope } from './error';
import { uiLanguageSchema } from './locale';

const c = initContract();

/** The account as its owner reads it (`M01-14`, `M01-18`): the phone is identity and never edited here. */
export const userProfileSchema = z.object({
  id: uuidSchema,
  phoneE164: phoneE164Schema,
  name: z.string(),
  interfaceLanguage: uiLanguageSchema,
  unitPreference: measurementSystemSchema,
});
export type UserProfile = z.infer<typeof userProfileSchema>;

/** The one profile write (`M01-14`): name, language, units. The photo joins with the file slice. */
export const updateUserProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    interfaceLanguage: uiLanguageSchema,
    unitPreference: measurementSystemSchema,
  })
  .partial();
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const userContract = c.router({
  updateMe: {
    method: 'PATCH',
    path: '/users/me',
    body: updateUserProfileSchema,
    summary: 'Edit my own profile — name, interface language, units',
    responses: {
      200: userProfileSchema,
      401: errorEnvelope(baseError('UNAUTHENTICATED')),
    },
  },
});
