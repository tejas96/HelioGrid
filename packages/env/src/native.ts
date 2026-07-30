/**
 * The React Native entry.
 *
 * Bare RN has NO `process.env` at runtime, so unlike ./server and ./web this entry cannot read
 * a source itself — the caller passes one in. That is the correct seam rather than a
 * limitation: the schema and the validator stay shared (which is what makes this one service
 * instead of three), and swapping where raw values come from is a change in ONE file,
 * `apps/mobile/src/env.ts`.
 *
 * Today that file supplies a platform-selected localhost, because that is genuinely all the
 * configuration the app has: the Android emulator reaches the host at 10.0.2.2 and the iOS
 * simulator at localhost. When a deployed API URL exists, a native config module
 * (react-native-config or equivalent) becomes the source and nothing here changes.
 */
import { parseEnv } from './parse';
import { type MobileEnv, mobileEnvSchema } from './schema/mobile';

let cache: MobileEnv | undefined;

export function loadNativeEnv(source: Record<string, string | undefined>): MobileEnv {
  if (!cache) cache = parseEnv(mobileEnvSchema, source, 'apps/mobile');
  return cache;
}

export type { MobileEnv } from './schema/mobile';
