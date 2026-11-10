import { MESSAGE_TEMPLATE_KEYS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, uuidSchema } from '../common';
import { baseError, errorEnvelope, keyReusedEnvelope, unauthenticatedEnvelope } from '../error';
import { leadParamsSchema } from './leads';
import { capturedAtSchema } from './schemas';

const c = initContract();

/*
 * Customer messages as copy-paste text (`M02-33`, `M02-47`, `M02-48`, block 3 RFC decision 15): the
 * tenant's template filled for this lead, handed back to be sent from the person's own phone. The
 * timeline records "Message copied" and never claims a delivery.
 */

/** The two messages the CRM composes: the visit confirmation, and the follow-up nudge. */
export const crmMessageTemplateKeySchema = z
  .enum(MESSAGE_TEMPLATE_KEYS)
  .extract(['visit_confirmation', 'follow_up_nudge']);
export type CrmMessageTemplateKey = z.infer<typeof crmMessageTemplateKeySchema>;

/**
 * Which message, and for a visit confirmation the visit it confirms — what, when, who is coming and
 * their number. A visit is confirmed once and reminded once (`M02-48`): composing it again answers
 * the same text and records no second message.
 */
export const composeMessageSchema = z
  .object({
    templateKey: crmMessageTemplateKeySchema,
    visitId: uuidSchema.optional(),
    capturedAt: capturedAtSchema,
  })
  .strict()
  .refine((body) => body.templateKey !== 'visit_confirmation' || body.visitId !== undefined, {
    path: ['visitId'],
    message: 'a visit confirmation names its visit',
  });
export type ComposeMessage = z.infer<typeof composeMessageSchema>;

/** The text, ready to paste — nothing was sent. */
export const composedMessageSchema = z.object({ text: z.string() });
export type ComposedMessageWire = z.infer<typeof composedMessageSchema>;

export const leadMessagesContract = c.router({
  compose: {
    method: 'POST',
    path: '/leads/:id/messages',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: composeMessageSchema,
    summary:
      'Compose a customer message as text to copy — the timeline records it was copied and claims no delivery',
    responses: {
      201: composedMessageSchema,
      401: unauthenticatedEnvelope,
      /** No such lead the reader may see, or no such visit on it. */
      404: errorEnvelope(baseError('NOT_FOUND')),
      422: keyReusedEnvelope,
    },
  },
});
