import type { ErrorDetail } from '@heliogrid/contracts';
import { HttpException, type HttpStatus } from '@nestjs/common';
import type { z } from 'zod';

/**
 * Throw this whenever the route's contract declares a code that is NOT one of the base
 * codes — e.g. auth.completeOnboarding declares 409 `ALREADY_ONBOARDED`, while a plain
 * `ConflictException` makes the filter emit the generic `CONFLICT`.
 *
 * `status` is REQUIRED, and that is deliberate. It used to default via
 * `errorHttpStatusByCode[code]`, but that map only holds BASE codes — a route-specific
 * literal missed it and silently fell back to 500, so the wire carried the right code with
 * the wrong status — caught by an end-to-end curl, not by typecheck. The
 * throw site always knows the status its contract declares; making it required means the
 * mistake cannot recur.
 *
 * The code↔contract match itself stays procedural (Nest exceptions carry no contract type):
 * a route whose contract declares a non-base error code must throw this with that literal.
 */
export class ContractException extends HttpException {
  constructor(
    /** The literal declared in the route's `errorEnvelope(...)` union. */
    readonly code: string,
    message: string,
    status: HttpStatus | number,
    /** Field-addressable, the schema field path — what a refusal explains per field (`M01-25`). */
    readonly details?: ErrorDetail[],
    /** What it was refused over, for a code declared with `errorEnvelopeWithFacts`; else absent. */
    readonly facts?: unknown,
  ) {
    super(message, status);
  }
}

/** What a refusal declared with `errorEnvelopeWithFacts` carries: its code, its words, its facts. */
type RefusalOf<Envelope extends z.ZodTypeAny> =
  z.infer<Envelope> extends { error: { code: infer Code; facts: infer Facts } }
    ? { readonly code: Code & string; readonly message: string; readonly facts: Facts }
    : never;

/**
 * A refusal carrying its facts (`errorEnvelopeWithFacts`), typed by the envelope the route
 * declares for that status — a fact the contract does not name fails to compile, so the screen
 * gets in one round trip exactly what its contract promises.
 */
export function refusalWithFacts<Envelope extends z.ZodTypeAny>(
  _declared: Envelope,
  status: HttpStatus,
  refusal: RefusalOf<Envelope>,
): ContractException {
  return new ContractException(refusal.code, refusal.message, status, undefined, refusal.facts);
}
