import { type CustomDecorator, SetMetadata } from '@nestjs/common';

/**
 * Opt OUT of the global session guard. The guard is deny-by-default (registered as
 * APP_GUARD), so an endpoint is authenticated unless it says otherwise here — a new
 * controller cannot ship unauthenticated by forgetting a decorator, only by adding one.
 */
export const IS_PUBLIC = 'isPublic';
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC, true);
