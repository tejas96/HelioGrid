import { HttpException, type HttpStatus } from '@nestjs/common';

/**
 * Throw this whenever the route's contract declares a code that is NOT one of the base
 * codes — e.g. auth.completeOnboarding declares 409 `ALREADY_ONBOARDED`, while a plain
 * `ConflictException` makes the filter emit the generic `CONFLICT`.
 *
 * `status` is REQUIRED, and that is deliberate. It used to default via
 * `errorHttpStatusByCode[code]`, but that map only holds BASE codes — a route-specific
 * literal missed it and silently fell back to 500, so the wire carried the right code with
 * the wrong status (caught by an end-to-end curl on 2026-07-27, not by typecheck). The
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
  ) {
    super(message, status);
  }
}
