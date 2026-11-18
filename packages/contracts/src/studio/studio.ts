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
