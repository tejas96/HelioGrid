import { type EntitlementBlocked, httpStatusFor } from '@heliogrid/contracts';
import { HttpException } from '@nestjs/common';

/**
 * The words every refusal carries (`F8-34`): true for a billing pause and a cap pause alike, naming
 * the four acts no pause ever takes away, and no internal identifier. A screen renders `blocked`
 * through its own copy; this is what a client with nothing better shows.
 */
const PAUSED_MESSAGE =
  'This is paused for your company. Reading, export, customer links and billing still work.';

/**
 * The ONE way to refuse a paused mutation (`M12-21`, `M12-23`): 403 `ENTITLEMENT_BLOCKED`
 * carrying what blocked it. Every gate throws this and nothing else, and the Biome plugin
 * `entitlement-blocked-literal` refuses the code written anywhere but here and its contract, so
 * no second enforcement point can be written by hand.
 */
export class EntitlementBlockedException extends HttpException {
  readonly code = 'ENTITLEMENT_BLOCKED';

  constructor(readonly blocked: EntitlementBlocked) {
    super(PAUSED_MESSAGE, httpStatusFor('ENTITLEMENT_BLOCKED'));
  }
}
