import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { measurementSystemSchema, phoneE164Schema, uuidSchema } from './common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from './error';
import { fileErrorCodeSchema } from './file';
import { uiLanguageResponseSchema, uiLanguageSchema } from './locale';

const c = initContract();

/** The account as its owner reads it (`M01-14`, `M01-18`): the phone is identity and never edited here. */
export const userProfileSchema = z.object({
  id: uuidSchema,
  phoneE164: phoneE164Schema,
  name: z.string(),
  interfaceLanguage: uiLanguageResponseSchema,
  unitPreference: measurementSystemSchema,
});
export type UserProfile = z.infer<typeof userProfileSchema>;

/** The account's profile write (`M01-14`): name, language, units. The photo is per company: `setMyPhoto`. */
export const updateUserProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    interfaceLanguage: uiLanguageSchema,
    unitPreference: measurementSystemSchema,
  })
  .partial();
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

/**
 * My photo in the company I am signed in to (`M01-14`): a confirmed file I stored against my own
 * `user_account`, or `null` to go back to my initials. Each company keeps its own.
 */
export const setMyPhotoSchema = z.object({ fileId: uuidSchema.nullable() });
export type SetMyPhoto = z.infer<typeof setMyPhotoSchema>;

export const myPhotoSchema = z.object({ photoFileId: uuidSchema.nullable() });
export type MyPhoto = z.infer<typeof myPhotoSchema>;

export const userContract = c.router({
  updateMe: {
    method: 'PATCH',
    path: '/users/me',
    body: updateUserProfileSchema,
    summary: 'Edit my own profile — name, interface language, units',
    responses: {
      200: userProfileSchema,
      401: unauthenticatedEnvelope,
    },
  },
  getMyPhoto: {
    method: 'GET',
    path: '/users/me/photo',
    summary: 'My photo in this company, or null for my initials',
    responses: {
      200: myPhotoSchema,
      401: unauthenticatedEnvelope,
    },
  },
  setMyPhoto: {
    method: 'PUT',
    path: '/users/me/photo',
    body: setMyPhotoSchema,
    summary: 'Point my photo in this company at a file I stored, or clear it',
    responses: {
      200: myPhotoSchema,
      401: unauthenticatedEnvelope,
      /** No confirmed photo of mine in this company: another's, another company's, another kind. */
      404: errorEnvelope(baseError('NOT_FOUND')),
      /** Declared, never stored. */
      409: errorEnvelope(fileErrorCodeSchema.extract(['FILE_NOT_UPLOADED'])),
    },
  },
});
