import { type LeadScope, leadScopeOf, type RolePreset } from '@heliogrid/domain';
import type { Request } from 'express';
import { rolesOf, sessionOf, tenantIdOf } from '../../../common/auth/session-context';

/**
 * Who reads or acts on leads: the company, the person, and the leads their presets reach
 * (`leadScopeOf`, `F2-12`…`F2-14`). Built once per request from the session.
 */
export interface LeadReader {
  readonly tenantId: string;
  readonly actorId: string;
  readonly roles: readonly RolePreset[];
  readonly scope: LeadScope;
}

/** The session's company, person, presets and the leads those presets reach. */
export function readerOf(req: Request): LeadReader {
  const roles = rolesOf(req);
  return {
    tenantId: tenantIdOf(req),
    actorId: sessionOf(req).actor.userId,
    roles,
    scope: leadScopeOf(roles),
  };
}

/** How the acting person is named on what they write — a notice's asker, an enquiry's `askedBy`. */
export function actorNameOf(req: Request): string {
  return sessionOf(req).actor.displayName;
}
