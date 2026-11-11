import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { uuidSchema } from '../common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from '../error';
import { leadParamsSchema } from './leads';
import { capturedAtSchema, memberRefSchema } from './schemas';

const c = initContract();

/*
 * A lead's files (`M02-32`, ruling 2026-11-10): the customer's bill, a roof photo, an ID — each a
 * file stored against the lead through the files routes, then put on the lead under its name. The
 * project won from the lead lists the same rows.
 */

/** A file's name as the team reads it: the picker's own, which no file system lets pass 255. */
export const leadFileNameSchema = z.string().trim().min(1).max(255);

/** One file on the lead, with who added it and when. */
export const leadFileSchema = z.object({
  /** The `lead_file` row. */
  id: uuidSchema,
  fileId: uuidSchema,
  name: z.string(),
  contentType: z.string(),
  addedAt: z.string().datetime(),
  addedBy: memberRefSchema,
});
export type LeadFile = z.infer<typeof leadFileSchema>;

/** The lead's files, oldest first. */
export const leadFilesSchema = z.object({ items: z.array(leadFileSchema) });
export type LeadFiles = z.infer<typeof leadFilesSchema>;

/**
 * A stored file put on the lead. The file id is its own retry key: the same file sent again adds
 * no second row and answers the same list.
 */
export const attachLeadFileSchema = z
  .object({ fileId: uuidSchema, name: leadFileNameSchema, capturedAt: capturedAtSchema })
  .strict();
export type AttachLeadFile = z.infer<typeof attachLeadFileSchema>;

/** The file has not finished uploading, or it was stored for another record — never this lead's. */
export const LEAD_FILE_NOT_READY = 'LEAD_FILE_NOT_READY' as const;
const notReady = errorEnvelope(z.literal(LEAD_FILE_NOT_READY));

/** No such lead the reader may see. */
const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const leadFilesContract = c.router({
  list: {
    method: 'GET',
    path: '/leads/:id/files',
    pathParams: leadParamsSchema,
    summary: 'The lead’s files, oldest first, each with who added it and when',
    responses: { 200: leadFilesSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  attach: {
    method: 'POST',
    path: '/leads/:id/files',
    pathParams: leadParamsSchema,
    body: attachLeadFileSchema,
    summary:
      'Put a file stored for the lead on it, under its name — answered with the lead’s files; the same file again adds nothing',
    responses: {
      200: leadFilesSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: notReady,
    },
  },
});
