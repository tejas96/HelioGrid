import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema } from '../common';
import { baseError, errorEnvelope, keyReusedEnvelope, unauthenticatedEnvelope } from '../error';
import {
  createDesignSchema,
  designActRefusedEnvelope,
  designDetailSchema,
  designHostParamsSchema,
  designParamsSchema,
  designSetSchema,
  recommendDesignSchema,
} from './design';
import {
  designDocumentSchema,
  designSaveConflictEnvelope,
  editTurnSchema,
  saveDocumentSchema,
  savedDocumentSchema,
  skyPictureSchema,
} from './document';
import {
  addCadPlanSchema,
  addDesignPictureSchema,
  designPictureFileRefusedEnvelope,
  designPictureParamsSchema,
  designPictureSchema,
} from './picture';
import {
  placeAnswerSchema,
  placeAtQuerySchema,
  placeDetailsQuerySchema,
  placeSuggestionsQuerySchema,
  placeSuggestionsSchema,
} from './places';
import { saveSiteSchema } from './site';

const c = initContract();

/*
 * The design studio as HelioGrid hosts it: a design hangs on a lead, is read by whoever may read
 * that lead, and is made and changed by whoever holds `studio.create_edit_designs`. This file is
 * the one place the studio's wire spells the host's record; every shape it carries is the studio's
 * own (`docs/tasks/M05-design-studio.md`, *The wall*).
 */

const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const studioContract = c.router({
  leadDesigns: {
    method: 'GET',
    path: '/leads/:id/designs',
    pathParams: designHostParamsSchema,
    summary: 'The designs of one lead, newest first, and whether the reader may add one',
    responses: { 200: designSetSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  create: {
    method: 'POST',
    path: '/leads/:id/designs',
    pathParams: designHostParamsSchema,
    headers: createHeadersSchema,
    body: createDesignSchema,
    summary:
      'Make the next design of the lead — empty, or a copy of one of its designs; a closed lead takes none',
    responses: {
      201: designDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: z.union([designActRefusedEnvelope, keyReusedEnvelope]),
    },
  },
  detail: {
    method: 'GET',
    path: '/designs/:id',
    pathParams: designParamsSchema,
    summary: 'One design: where it stands, the site it is for, and what the reader may do',
    responses: { 200: designDetailSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  saveSite: {
    method: 'PUT',
    path: '/designs/:id/site',
    pathParams: designParamsSchema,
    body: saveSiteSchema,
    summary:
      'Save the site details whole: the site’s facts on the record that holds them, roof or ground on the design',
    responses: {
      200: designDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: designActRefusedEnvelope,
    },
  },
  recommend: {
    method: 'PUT',
    path: '/designs/:id/recommended',
    pathParams: designParamsSchema,
    body: recommendDesignSchema,
    summary:
      'Mark the design as the one recommended, or take the mark off — one design of a lead at most',
    responses: { 200: designSetSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  document: {
    method: 'GET',
    path: '/designs/:id/document',
    pathParams: designParamsSchema,
    summary: 'The design document as it stands, who saved it last, and who holds its turn to edit',
    responses: { 200: designDocumentSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  saveDocument: {
    method: 'PUT',
    path: '/designs/:id/document',
    pathParams: designParamsSchema,
    body: saveDocumentSchema,
    summary:
      'Save the whole document over the version it was changed from — refused when someone saved since or holds the turn',
    responses: {
      200: savedDocumentSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: designSaveConflictEnvelope,
      422: designActRefusedEnvelope,
    },
  },
  takeEditTurn: {
    method: 'PUT',
    path: '/designs/:id/edit-turn',
    pathParams: designParamsSchema,
    body: c.noBody(),
    summary:
      'Take the turn to edit, or renew it — answered with whoever holds it, the reader only when it was free; a closed lead gives none',
    responses: {
      200: editTurnSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: designActRefusedEnvelope,
    },
  },
  giveEditTurn: {
    method: 'DELETE',
    path: '/designs/:id/edit-turn',
    pathParams: designParamsSchema,
    body: c.noBody(),
    summary: 'Give back the turn to edit; a turn the reader does not hold stays as it is',
    responses: { 204: c.noBody(), 401: unauthenticatedEnvelope, 404: notFound },
  },
  addPicture: {
    method: 'POST',
    path: '/designs/:id/pictures',
    pathParams: designParamsSchema,
    headers: createHeadersSchema,
    body: addDesignPictureSchema,
    summary:
      'Keep a picture of the company’s own with the design, read on the device: its facts and its stored parts',
    responses: {
      201: designPictureSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: z.union([designPictureFileRefusedEnvelope, designActRefusedEnvelope, keyReusedEnvelope]),
    },
  },
  addCadPlan: {
    method: 'POST',
    path: '/designs/:id/cad-plans',
    pathParams: designParamsSchema,
    headers: createHeadersSchema,
    body: addCadPlanSchema,
    summary:
      'Keep a CAD plan with the design — a stored DWG or binary DXF — and start our server reading it into lines',
    responses: {
      201: designPictureSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: z.union([designPictureFileRefusedEnvelope, designActRefusedEnvelope, keyReusedEnvelope]),
    },
  },
  picture: {
    method: 'GET',
    path: '/designs/:id/pictures/:pictureId',
    pathParams: designPictureParamsSchema,
    summary: 'A picture of the design’s own as it stands, with short-lived links to its parts',
    responses: { 200: designPictureSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  skyPicture: {
    method: 'GET',
    path: '/designs/:id/sky-picture',
    pathParams: designParamsSchema,
    summary:
      'The sky picture of the design’s site, fetched now and never stored — or why there is none',
    responses: { 200: skyPictureSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
});

/** Finding a site's place. No company record is read: the routes ask the map service alone. */
export const placesContract = c.router({
  suggest: {
    method: 'GET',
    path: '/places/suggestions',
    query: placeSuggestionsQuerySchema,
    summary: 'Places that match a typed address, in the company’s market',
    responses: { 200: placeSuggestionsSchema, 401: unauthenticatedEnvelope },
  },
  details: {
    method: 'GET',
    path: '/places/details',
    query: placeDetailsQuerySchema,
    summary: 'The address, the point and the region of a suggested place',
    responses: { 200: placeAnswerSchema, 401: unauthenticatedEnvelope },
  },
  at: {
    method: 'GET',
    path: '/places/at',
    query: placeAtQuerySchema,
    summary: 'The address and the region at a typed point',
    responses: { 200: placeAnswerSchema, 401: unauthenticatedEnvelope },
  },
});
