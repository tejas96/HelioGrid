import { DefaultLogger, type LogLevel, Runtime } from '@temporalio/worker';

type LineLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/** The app's Pino logger, or any logger writing through its redaction (`common/logging.ts`). */
export type LogLineWriter = Record<LineLevel, (fields: object, message: string) => void>;

const LINE_LEVEL: Record<LogLevel, LineLevel> = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * The Temporal SDK's logger, writing each line through the app's Pino logger. The SDK's own
 * prints its metadata raw to the console — an activity's task token, which completes or fails
 * that activity, included — out of reach of `REDACTED_PATHS`. The SDK names a step's error
 * `error`; it is written as `err` so the error ALLOWLIST serialises it, not every property a
 * driver hangs on it (a failed query's parameters).
 */
export function temporalLoggerWritingTo(writer: LogLineWriter): DefaultLogger {
  return new DefaultLogger('INFO', ({ level, message, meta }) => {
    const { error, ...fields } = meta ?? {};
    writer[LINE_LEVEL[level]](error === undefined ? fields : { ...fields, err: error }, message);
  });
}

/**
 * Once per process, before the first Temporal connection or worker: the SDK's runtime is a
 * process singleton that takes its logger when it is created, and `Runtime.install` throws once
 * one exists. The native core's own lines are forwarded through the same logger at the SDK's
 * default levels instead of being printed beside it.
 */
export function routeTemporalLogsTo(writer: LogLineWriter): void {
  Runtime.install({
    logger: temporalLoggerWritingTo(writer),
    telemetryOptions: { logging: { forward: {} } },
  });
}
