import type { FileSubjectRule } from '@heliogrid/domain';

/** A megabyte as a person reads a file's size: a million bytes. */
const BYTES_PER_MB = 1_000_000;

/** The kinds a file names at the end of its own name — facts, never translated. */
const SHORT_NAME: Readonly<Record<string, string>> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'application/pdf': 'PDF',
};

/**
 * What a record's file rule says a refused pick in words: the largest file it takes, in MB, and
 * the kinds it takes — read from the rule, so the words follow it if it changes.
 */
export function fileLimitsOf(rule: Pick<FileSubjectRule, 'maxBytes' | 'contentTypes'>) {
  return {
    size: rule.maxBytes / BYTES_PER_MB,
    types: rule.contentTypes.map((type) => SHORT_NAME[type] ?? type).join(', '),
  };
}
