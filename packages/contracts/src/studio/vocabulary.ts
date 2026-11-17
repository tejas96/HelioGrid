import { DESIGN_ACT_REFUSALS, DESIGN_MOUNTS, DESIGN_STATUSES } from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum } from '../common';

/**
 * The design studio's vocabularies on the wire, each derived from domain's tuple. A write and the
 * pgEnum mirror take the closed enum; a response takes the open one, so an app built before a new
 * status still reads the list.
 */
export const designMountSchema = z.enum(DESIGN_MOUNTS);
export const designMountReadSchema = extensibleEnum(DESIGN_MOUNTS);
export const designStatusSchema = z.enum(DESIGN_STATUSES);
export const designStatusReadSchema = extensibleEnum(DESIGN_STATUSES);
export const designActRefusalSchema = extensibleEnum(DESIGN_ACT_REFUSALS);
