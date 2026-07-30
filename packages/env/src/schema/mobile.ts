import { z } from 'zod';
import { originSchema } from './fragments';

/**
 * What the React Native app needs from configuration. Like the web schema, everything here
 * ships inside the app bundle and is therefore public — no secrets.
 *
 * No `.default()` on API_URL, unlike the web schema: on mobile the correct localhost differs
 * per platform (the Android emulator reaches the host at 10.0.2.2, the iOS simulator at
 * localhost), so a single default would be wrong on one of them. The app supplies the value
 * and this schema's job is to reject a malformed one.
 */
export const mobileEnvSchema = z.object({
  API_URL: originSchema,
});

export type MobileEnv = z.infer<typeof mobileEnvSchema>;
