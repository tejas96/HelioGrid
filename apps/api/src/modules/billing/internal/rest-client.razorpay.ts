import { PinoLogger } from 'nestjs-pino';
import type { z } from 'zod';

/** Razorpay's REST API with the key pair: the one place a call is made and its refusal named. */

const API = 'https://api.razorpay.com/v1';
/** A gateway call that has not answered by now has failed; the caller says so and nothing is kept. */
const CALL_TIMEOUT_MS = 10_000;

export interface RazorpayKeys {
  readonly keyId: string;
  readonly keySecret: string;
  readonly webhookSecret: string;
}

const BAD_REQUEST = 400;
const NOT_FOUND = 404;
/** The first status that says the gateway failed, rather than refused the request. */
const SERVER_ERROR = 500;
/** Razorpay's answers to a plan id it does not hold: 400 for a well-formed id, 404 for any other. */
const UNKNOWN_ID_STATUSES: readonly number[] = [BAD_REQUEST, NOT_FOUND];

/** A call the gateway answered with a non-2xx status. */
export class GatewayRefusal extends Error {
  constructor(
    readonly status: number,
    method: string,
    path: string,
  ) {
    super(`the gateway answered ${status} to ${method} ${path}`);
  }

  /** The gateway answered no (4xx): nothing was done. A 5xx may have done it. */
  get refusedOutright(): boolean {
    return this.status < SERVER_ERROR;
  }

  /** The gateway does not hold the id it was asked about. */
  get unknownId(): boolean {
    return UNKNOWN_ID_STATUSES.includes(this.status);
  }
}

export class RazorpayRest {
  constructor(
    private readonly keys: RazorpayKeys,
    private readonly logger: PinoLogger,
  ) {}

  /** One REST call. Throws on a timeout, a refusal or an answer it cannot read; logs no body. */
  async call<T>(
    method: 'GET' | 'POST',
    path: string,
    answer: z.ZodType<T>,
    body?: object,
  ): Promise<T> {
    const auth = Buffer.from(`${this.keys.keyId}:${this.keys.keySecret}`).toString('base64');
    // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to a third party and no typed client exists for it
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    if (!response.ok) {
      this.logger.warn(
        { method, path: path.split('?')[0], status: response.status },
        'gateway refused a call',
      );
      throw new GatewayRefusal(response.status, method, path.split('?')[0] ?? path);
    }
    return answer.parse(await response.json());
  }
}
