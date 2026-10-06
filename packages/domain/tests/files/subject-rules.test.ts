import { describe, expect, it } from 'vitest';
import {
  FILE_MAX_BYTES,
  FILE_SUBJECT_KINDS,
  FILE_SUBJECT_RULES,
  type FileSubjectRule,
  judgeFileDeclaration,
  mayReadFile,
  mayUploadFile,
} from '../../src/files/rules';
import { FILE_CONTENT_TYPES } from '../../src/files/vocabulary';

/**
 * Who may store a file against a subject, how large and of which type (`T-FPLAT-035`). The rule
 * is passed in, so each branch is proven with a rule shaped for it rather than hoping today's
 * table happens to reach it.
 */
const pngOnly: FileSubjectRule = {
  upload: 'onboarding.manage_tenant_settings',
  read: 'member',
  maxBytes: 100,
  contentTypes: ['image/png'],
};

describe('judgeFileDeclaration — the size and type a kind takes', () => {
  it.each([
    [1, 'accepted'],
    [99, 'accepted'],
    [100, 'accepted'],
    [101, 'too-large'],
  ] as const)('a %i-byte file against a 100-byte rule is %s', (byteSize, verdict) => {
    expect(judgeFileDeclaration(pngOnly, 'image/png', byteSize)).toBe(verdict);
  });

  it('refuses a type the kind does not take, even one the vocabulary knows', () => {
    expect(judgeFileDeclaration(pngOnly, 'image/jpeg', 10)).toBe('type-not-taken');
  });

  it('the logo takes up to 2 MB', () => {
    const logo = FILE_SUBJECT_RULES.tenant;
    expect(judgeFileDeclaration(logo, 'image/png', 2_000_000)).toBe('accepted');
    expect(judgeFileDeclaration(logo, 'image/jpeg', 2_000_000)).toBe('accepted');
    expect(judgeFileDeclaration(logo, 'image/png', 2_000_001)).toBe('too-large');
  });

  it('every kind stays within the ceiling and the vocabulary', () => {
    for (const kind of FILE_SUBJECT_KINDS) {
      const rule = FILE_SUBJECT_RULES[kind];
      expect(rule.maxBytes).toBeLessThanOrEqual(FILE_MAX_BYTES);
      expect(rule.contentTypes.length).toBeGreaterThan(0);
      for (const type of rule.contentTypes) expect(FILE_CONTENT_TYPES).toContain(type);
    }
  });
});

describe('mayUploadFile / mayReadFile — the kind names the capability', () => {
  it.each([
    [['epc_owner'], true],
    [['sales_executive'], false],
    [['sales_executive', 'epc_owner'], true],
    [[], false],
  ] as const)('%j may upload the logo: %s', (roles, allowed) => {
    expect(mayUploadFile(roles, FILE_SUBJECT_RULES.tenant)).toBe(allowed);
  });

  it.each([
    [['epc_owner'], true, true],
    [['operations'], true, true],
    [['finance'], false, true],
    [['finance', 'operations'], true, true],
    [['sales_executive'], false, false],
    [[], false, false],
  ] as const)('%j may upload a price list: %s, and read one: %s', (roles, upload, read) => {
    expect(mayUploadFile(roles, FILE_SUBJECT_RULES.catalog)).toBe(upload);
    expect(mayReadFile(roles, FILE_SUBJECT_RULES.catalog)).toBe(read);
  });

  it('a member-readable kind is readable by any role and by none', () => {
    expect(mayReadFile(['field_technician'], pngOnly)).toBe(true);
    expect(mayReadFile([], pngOnly)).toBe(true);
  });

  it('a capability-readable kind is readable only with that capability', () => {
    const restricted: FileSubjectRule = { ...pngOnly, read: 'onboarding.manage_tenant_settings' };
    expect(mayReadFile(['epc_owner'], restricted)).toBe(true);
    expect(mayReadFile(['sales_executive'], restricted)).toBe(false);
  });
});
