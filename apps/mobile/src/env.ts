import { API_PORT_DEFAULT } from '@heliogrid/env';
import { loadNativeEnv } from '@heliogrid/env/native';
import { Platform } from 'react-native';

/**
 * apps/mobile's view of the environment. A ROOT file beside `i18n.ts`, deliberately not
 * `src/config/env.ts`: apps/mobile/CLAUDE.md fixes `src/` as a closed set of folder
 * categories plus root files, and a new category is a plan-time call. (The literal list is
 * NOT restated here — it drifted once already.)
 *
 * This is the ONLY place the app decides where raw configuration comes from — bare RN has no
 * runtime `process.env`, so `@heliogrid/env/native` takes the source as a parameter and does
 * the validating. Swapping in a native config module later changes this object and nothing
 * else.
 *
 * The two HOSTS are not a default that could live in the schema: the Android emulator reaches
 * the host machine at 10.0.2.2 while the iOS simulator uses localhost, so that half is
 * platform-determined rather than deployment-determined. The PORT is not — it is the api's own,
 * read from `@heliogrid/env` so a moved port moves here too.
 */
const ENV = loadNativeEnv({
  API_URL: Platform.select({
    android: `http://10.0.2.2:${API_PORT_DEFAULT}`,
    default: `http://localhost:${API_PORT_DEFAULT}`,
  }),
});

/** Validated origin of apps/api. Never a bare localhost fallback at a call site. */
export const API_URL = ENV.API_URL;
