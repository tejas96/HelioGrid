import { loadNativeEnv } from '@heliogrid/env/native';
import { Platform } from 'react-native';

/**
 * apps/mobile's view of the environment. A ROOT file beside `i18n.ts`, deliberately not
 * `src/config/env.ts`: CLAUDE.md fixes `src/` as the closed set {auth,data,hooks,navigation,
 * push,screens,ui} plus root files, and a new folder category would need an ADR (Law 2).
 *
 * This is the ONLY place the app decides where raw configuration comes from — bare RN has no
 * runtime `process.env`, so `@heliogrid/env/native` takes the source as a parameter and does
 * the validating. Swapping in a native config module later changes this object and nothing
 * else.
 *
 * The two localhosts are not a default that could live in the schema: the Android emulator
 * reaches the host machine at 10.0.2.2 while the iOS simulator uses localhost, so the value is
 * platform-determined rather than deployment-determined.
 */
const ENV = loadNativeEnv({
  API_URL: Platform.select({
    android: 'http://10.0.2.2:8084',
    default: 'http://localhost:8084',
  }),
});

/** Validated origin of apps/api. Never `?? 'http://localhost:8084'` at a call site. */
export const API_URL = ENV.API_URL;
