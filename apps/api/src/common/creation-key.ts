import { createHash } from 'node:crypto';
import {
  type CreateHeaders,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_REUSED,
} from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from './errors/contract-exception';

/**
 * A create's retry key and the one request it answers (`F4-07`). The fingerprint is sha-256 over
 * the actor, the route and the PARSED body — zod emits an object's keys in schema order, so the
 * same input always hashes the same, and a key replayed by another person or with another body
 * never matches.
 */
export interface CreationKey {
  readonly key: string;
  readonly fingerprint: string;
}

/**
 * How a keyed create ended: the row it made, the row an earlier send with this key made, or the
 * key already answering a different request. A create sent without a key only ever `created`.
 */
export type Keyed<Row> =
  | { readonly outcome: 'created' | 'replayed'; readonly row: Row }
  | { readonly outcome: 'key-reused' };

/** The contract's own route, so no route name is typed twice. */
export interface ContractRoute {
  readonly method: string;
  readonly path: string;
}

export function routeName(route: ContractRoute): string {
  return `${route.method} ${route.path}`;
}

/** Null when the send carried no key — an app that has not updated — and it is applied as before. */
export function creationKeyOf(
  headers: CreateHeaders,
  actorUserId: string,
  route: ContractRoute,
  body: unknown,
): CreationKey | null {
  const key = headers[IDEMPOTENCY_KEY_HEADER];
  if (key === undefined) return null;
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([actorUserId, routeName(route), body]))
    .digest('hex');
  return { key, fingerprint };
}

/** What a row an earlier send made means for this one: the same request again, or another. */
export function replayOf<Row>(
  row: Row,
  storedFingerprint: string | null,
  key: CreationKey,
): Keyed<Row> {
  return storedFingerprint === key.fingerprint
    ? { outcome: 'replayed', row }
    : { outcome: 'key-reused' };
}

/**
 * Turns a keyed outcome into the row the route answers with: a replay is logged — the route and
 * the tenant, never the body — so a retry storm is visible, and a reused key is the 422 the create
 * routes declare, with nothing written.
 */
@Injectable()
export class CreationReplies {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(CreationReplies.name);
  }

  rowOf<Row>(keyed: Keyed<Row>, route: ContractRoute, tenantId: string | null): Row {
    if (keyed.outcome === 'key-reused') {
      throw new ContractException(
        IDEMPOTENCY_KEY_REUSED,
        'This retry key already made a record for a different request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (keyed.outcome === 'replayed') {
      this.logger.info({ route: routeName(route), tenantId }, 'a create replayed');
    }
    return keyed.row;
  }
}
