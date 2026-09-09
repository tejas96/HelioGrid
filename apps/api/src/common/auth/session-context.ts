import type { ResolvedSession, SessionProjection } from '@heliogrid/contracts';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Where the guard leaves the resolved session for the handler. A WeakMap keyed by the request
 * rather than a property on it: nothing else can plant one, and the request's own type stays
 * express's.
 */
const sessions = new WeakMap<Request, ResolvedSession>();

export function attachSession(req: Request, resolved: ResolvedSession): void {
  sessions.set(req, resolved);
}

function resolvedOf(req: Request): ResolvedSession {
  const resolved = sessions.get(req);
  if (!resolved) throw new UnauthorizedException('No session on this request.');
  return resolved;
}

/** The projection the guard resolved. A handler on a public route must not call this. */
export function sessionOf(req: Request): SessionProjection {
  return resolvedOf(req).session;
}

/**
 * The company this session acts under. The guard admits a `member` or capability route only with
 * a membership, so an absent one is a broken guard rather than a request to answer: it throws
 * loudly instead of inventing a status the route never declared.
 */
export function tenantIdOf(req: Request): string {
  const membership = sessionOf(req).membership;
  if (membership === null) throw new Error('the guard admitted a capability route with no company');
  return membership.tenantId;
}

/** The session row's id — for a sign-out and for binding a new company to this device. */
export function sessionIdOf(req: Request): string {
  return resolvedOf(req).sessionId;
}
