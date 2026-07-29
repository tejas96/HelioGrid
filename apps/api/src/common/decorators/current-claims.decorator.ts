import type { SessionClaims } from '@heliogrid/contracts';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * The verified session claims the guard attached to the request. This and `@Public()` are
 * the only custom decorators in the app (apps/api/CLAUDE.md) — `@CurrentTenant`/`@CurrentUser`
 * would be reads of this same object, so they do not exist.
 */
export const CurrentClaims = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<Request & { claims?: SessionClaims }>().claims;
});
