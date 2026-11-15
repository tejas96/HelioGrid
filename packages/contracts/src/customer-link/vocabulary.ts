import {
  DEVICE_CLASSES,
  LINK_EVENT_TYPES,
  LINK_FAILURE_REASONS,
  LINK_PHASES,
  LINK_SCOPES,
  LINK_SECTIONS,
  LINK_STATUSES,
} from '@heliogrid/domain';
import { z } from 'zod';

/*
 * The customer link's closed sets (`F5-21`, `F5-27`, `F5-29`), each derived from domain's tuple —
 * the wire's writes and the store's enums read one list (invariant `enum-parity`).
 */

export const linkStatusSchema = z.enum(LINK_STATUSES);
export const linkScopeSchema = z.enum(LINK_SCOPES);
export const linkPhaseSchema = z.enum(LINK_PHASES);
export const linkEventTypeSchema = z.enum(LINK_EVENT_TYPES);
export const deviceClassSchema = z.enum(DEVICE_CLASSES);
export const linkSectionSchema = z.enum(LINK_SECTIONS);
export const linkFailureReasonSchema = z.enum(LINK_FAILURE_REASONS);
