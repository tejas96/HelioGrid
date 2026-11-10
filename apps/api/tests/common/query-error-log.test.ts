import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { theAppsLogger } from '../support/app-log';

/**
 * A failed query's error names the values it bound — a phone number, a name — so a logged error
 * keeps the SQL, whose values are placeholders, and the database's verdict, never the values.
 */
const PHONE = '+919876543210';
const NAME = 'Priya';
const INSERT = 'insert into "lead" ("phone_e164", "name") values ($1, $2)';

function aFailedInsert(): DrizzleQueryError {
  const duplicate = Object.assign(
    new Error('duplicate key value violates unique constraint "lead_phone_e164_key"'),
    { code: '23505', detail: `Key (phone_e164)=(${PHONE}) already exists.` },
  );
  return new DrizzleQueryError(INSERT, [PHONE, NAME], duplicate);
}

function theLoggedError(error: Error): Record<string, unknown> {
  const { logger, lines } = theAppsLogger();
  logger.error({ err: error }, 'a request failed');
  return lines[0]?.err as Record<string, unknown>;
}

describe('a logged error', () => {
  it.each([
    ['a failed query', aFailedInsert()],
    [
      'an error caused by a failed query',
      new Error('the lead was not saved', { cause: aFailedInsert() }),
    ],
  ])('names no value %s bound', (_case, error) => {
    const logged = theLoggedError(error);

    expect(JSON.stringify(logged)).not.toContain(PHONE);
    expect(JSON.stringify(logged)).not.toContain(NAME);
    expect(logged.message).toContain(`Failed query: ${INSERT}`);
    expect(logged.stack).toContain(`Failed query: ${INSERT}`);
  });

  it('keeps a failed query’s SQLSTATE and the constraint the database names', () => {
    const logged = theLoggedError(aFailedInsert());

    expect(logged.code).toBe('23505');
    expect(logged.message).toContain('lead_phone_e164_key');
  });

  it('keeps any other error’s message and stack as they were', () => {
    const error = new Error('the stored IN pack is malformed');

    expect(theLoggedError(error)).toEqual({
      type: 'Error',
      message: 'the stored IN pack is malformed',
      stack: error.stack,
    });
  });
});
