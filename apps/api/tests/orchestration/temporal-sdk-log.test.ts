import { levels } from 'pino';
import { describe, expect, it } from 'vitest';
import { temporalLoggerWritingTo } from '../../src/common/temporal/temporal.sdk-logger';
import { theAppsLogger } from '../support/app-log';

/**
 * The Temporal SDK's lines are written by the app's own logger, through its redaction: an
 * activity's task token completes or fails that activity, so it never reaches a log line.
 */
const TASK_TOKEN = 'the-activity-task-token-in-this-test';
const QUERY_PARAMETER = '+919999999901';

function theSdkLogger() {
  const { logger, lines } = theAppsLogger();
  return { sdkLogger: temporalLoggerWritingTo(logger), lines };
}

function aFailedQuery(): Error {
  return Object.assign(new Error('Failed query: insert into "usage_event"'), {
    params: [QUERY_PARAMETER],
  });
}

describe('the Temporal SDK’s log lines', () => {
  it('write an activity’s task token as [redacted]', () => {
    const { sdkLogger, lines } = theSdkLogger();

    sdkLogger.warn('Activity failed', {
      taskToken: TASK_TOKEN,
      activityType: 'recordUsageEvent',
      error: aFailedQuery(),
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.taskToken).toBe('[redacted]');
    expect(JSON.stringify(lines[0])).not.toContain(TASK_TOKEN);
  });

  it('write a step’s error through the error allowlist, never its query parameters', () => {
    const { sdkLogger, lines } = theSdkLogger();

    sdkLogger.warn('Activity failed', { error: aFailedQuery() });

    expect(lines[0]?.err).toMatchObject({ message: 'Failed query: insert into "usage_event"' });
    expect(JSON.stringify(lines[0])).not.toContain(QUERY_PARAMETER);
  });

  it.each(['error', 'warn', 'info'] as const)(
    'write a %s message at its level with its fields',
    (level) => {
      const { sdkLogger, lines } = theSdkLogger();

      sdkLogger[level]('Worker state changed', { state: 'RUNNING', taskQueue: 'heliogrid-usage' });

      expect(lines).toEqual([
        expect.objectContaining({
          level: levels.values[level],
          msg: 'Worker state changed',
          state: 'RUNNING',
          taskQueue: 'heliogrid-usage',
        }),
      ]);
    },
  );

  it.each(['debug', 'trace'] as const)(
    'write no %s message, as the SDK’s own logger did',
    (level) => {
      const { sdkLogger, lines } = theSdkLogger();

      sdkLogger[level]('Activity completed', { durationMs: 3 });

      expect(lines).toEqual([]);
    },
  );
});
