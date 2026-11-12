import { randomUUID } from 'node:crypto';
import {
  IDEMPOTENCY_KEY_HEADER,
  type ProjectPayments,
  type RecordedPayment,
} from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import type { Reply } from '../support/http';
import { aLead, aWin, type Caller, dayFromToday, markWon, now } from './support';

/** What the payment proofs share: a won project at a final value, its money read, a recording. */

/** The final value every project in the payment proofs is won at, in rupees. */
export const wonAt = 450_000;
const finalValueText = `${wonAt}.00`;
/** The digits of a UTR after its lead digit. */
const utrTail = 11;

export const payKey = () => ({ [IDEMPOTENCY_KEY_HEADER]: randomUUID() });

/** A fresh twelve-digit UTR each run, so a rerun never meets the last run's receipts. */
export const freshUtr = (lead: string) =>
  `${lead}${String(Date.now()).padStart(utrTail, '0').slice(-utrTail)}`;

/** The UTR as a person might type it, a space after its first four digits. */
export const spaced = (utr: string) => utr.replace(/^(\d{4})/, '$1 ');

export async function aProjectAt(
  caller: Caller,
  managerId: string,
  finalValue = finalValueText,
): Promise<string> {
  const leadId = await aLead(caller);
  const won = await markWon(caller, leadId, aWin(managerId, { finalValue }));
  if (won.status !== HttpStatus.CREATED) throw new Error(`mark won: ${won.status}`);
  return won.body.projectId;
}

export const paymentsOf = async (caller: Caller, projectId: string) =>
  (await caller.call<ProjectPayments>('GET', `/projects/${projectId}/payments`)).body;

export function recordPayment(
  caller: Caller,
  projectId: string,
  body: Record<string, unknown>,
  headers = payKey(),
): Promise<Reply<RecordedPayment>> {
  return caller.call<RecordedPayment>(
    'POST',
    `/projects/${projectId}/payments`,
    {
      mode: 'upi',
      reference: null,
      receivedOn: dayFromToday(0),
      capturedAt: now(),
      ...body,
    },
    headers,
  );
}
