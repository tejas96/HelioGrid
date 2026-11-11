import { type ProjectScope, projectScopeOf, type RolePreset } from '@heliogrid/domain';
import type { Request } from 'express';
import { rolesOf, sessionOf, tenantIdOf } from '../../../common/auth/session-context';

/**
 * Who reads or acts on projects: the company, the person, their presets and the projects those
 * presets reach (`projectScopeOf`, `F2-14`). Built once per request from the session.
 */
export interface ProjectReader {
  readonly tenantId: string;
  readonly actorId: string;
  readonly roles: readonly RolePreset[];
  readonly scope: ProjectScope;
}

export function projectReaderOf(req: Request): ProjectReader {
  const roles = rolesOf(req);
  return {
    tenantId: tenantIdOf(req),
    actorId: sessionOf(req).actor.userId,
    roles,
    scope: projectScopeOf(roles),
  };
}
