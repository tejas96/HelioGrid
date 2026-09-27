import type { StorePlatform } from '@heliogrid/domain';
import { z } from 'zod';

/**
 * The phone's store version, sent on every request (`F4-36`). A request WITHOUT it is never
 * checked — the web app deploys with the api and never runs older than it, and a webhook or a
 * health check has no version to send.
 */
export const CLIENT_VERSION_HEADER = 'x-client-version' as const;

export const CLIENT_UPGRADE_REQUIRED = 'CLIENT_UPGRADE_REQUIRED' as const;

/**
 * 426 and no other: no route answers it, so a client can tell "this build is too old" from every
 * refusal a route makes. It carries no `Upgrade` header — it names an app to install, not a
 * protocol to switch to.
 */
export const CLIENT_UPGRADE_REQUIRED_STATUS = 426 as const;

/* One link per store platform: a platform the domain's `STORE_PLATFORMS` gains fails to compile here. */
const storeUrlsSchema = z.object({
  ios: z.string().url(),
  android: z.string().url(),
}) satisfies z.ZodType<Record<StorePlatform, string>>;

/**
 * What a phone below the server-declared minimum is answered, on ANY route, before the route
 * runs. Every build ever shipped reads this body with the code it shipped with, so its shape
 * never breaks: `emit-openapi` writes it onto every operation and `M26` judges each change.
 * Not a base code: the global filter never answers it, and the base set is closed (`M121`).
 */
export const clientUpgradeRequiredSchema = z.object({
  error: z.object({
    code: z.literal(CLIENT_UPGRADE_REQUIRED),
    message: z.string(),
    requestId: z.string(),
    upgrade: z.object({
      requiredVersion: z.string(),
      storeUrls: storeUrlsSchema,
    }),
  }),
});
export type ClientUpgradeRequired = z.infer<typeof clientUpgradeRequiredSchema>;
