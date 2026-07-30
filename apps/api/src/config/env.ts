import { type ApiEnv, loadApiEnv } from '@heliogrid/env/server';

/**
 * apps/api's view of the environment. The READ and the validation live in @heliogrid/env —
 * this file only decides what a failure MEANS here, which is: do not boot.
 *
 * console.error, not the Nest logger: this runs before the DI container exists. exit(1) rather
 * than a thrown stack trace, because the operator needs the bad keys, not our call stack.
 */
function load(): ApiEnv {
  try {
    return Object.freeze(loadApiEnv());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export const ENV = load();
export type { ApiEnv };
