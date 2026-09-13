import { describe, expect, it } from 'vitest';
import { redactCredentials } from '../../src/scripts/redact-credentials';

/**
 * A command's stderr is what an operator pastes into a chat window when asking for help, and a
 * Postgres driver puts the whole connection string — password included — into its own message.
 * The edges that matter are the ones where a password hides: more than one URL on a line, a
 * password holding punctuation, and text that merely looks like one.
 */
describe('redactCredentials', () => {
  it.each([
    [
      'connect ECONNREFUSED postgres://app_admin:hunter2@db.flycast:5432/heliogrid',
      'connect ECONNREFUSED postgres://app_admin:***@db.flycast:5432/heliogrid',
    ],
    [
      'rediss://default:s3cr%3Et@fly-x.upstash.io:6379 unreachable',
      'rediss://default:***@fly-x.upstash.io:6379 unreachable',
    ],
    [
      'tried postgres://a:one@h/db then postgres://b:two@h/db',
      'tried postgres://a:***@h/db then postgres://b:***@h/db',
    ],
  ])('takes the password out of %o', (input, expected) => {
    expect(redactCredentials(input)).toBe(expected);
  });

  it.each([
    ['password authentication failed for user "app_admin"'],
    ['no route to host db.flycast:5432'],
    ['https://docs.example.com/postgres@2 is a url with no credential'],
    [''],
  ])('leaves %o alone, because there is no credential in it', (input) => {
    expect(redactCredentials(input)).toBe(input);
  });

  it('takes the WHOLE password when it holds an @, not the part before it', () => {
    const line = 'FATAL postgres://app_runtime:p@ss@db:5432/heliogrid — role has no CONNECT';
    expect(redactCredentials(line)).toBe(
      'FATAL postgres://app_runtime:***@db:5432/heliogrid — role has no CONNECT',
    );
  });
});
