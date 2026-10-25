import { describe, expect, it } from 'vitest';
import type { CatalogImportState } from '../../src/catalog/import';
import {
  IMPORT_WIZARD_START,
  type ImportWizardEvent,
  type ImportWizardFrame,
  type ImportWizardView,
  importContinueGate,
  importListStep,
  importWizardFrame,
  importWizardStepIndex,
  importWizardViewAfter,
} from '../../src/catalog/import-wizard';

const AT_COLUMNS: ImportWizardView = { at: 'columns', fixing: false };
const AT_FILE: ImportWizardView = { at: 'file', fixing: false };
const FIXING: ImportWizardView = { at: null, fixing: true };

describe('importWizardFrame — what the wizard draws for a job and where the person stands', () => {
  it.each([
    [null, IMPORT_WIZARD_START, 'empty'],
    ['reading', IMPORT_WIZARD_START, 'reading'],
    ['unreadable', IMPORT_WIZARD_START, 'unreadable'],
    ['mapped', IMPORT_WIZARD_START, 'file'],
    ['mapped', AT_COLUMNS, 'columns'],
    ['matching', IMPORT_WIZARD_START, 'matching'],
    ['matching', AT_COLUMNS, 'columns'],
    ['previewed', IMPORT_WIZARD_START, 'preview'],
    ['previewed', AT_COLUMNS, 'columns'],
    ['previewed', AT_FILE, 'file'],
    ['running', AT_COLUMNS, 'running'],
    ['completed', IMPORT_WIZARD_START, 'report'],
    ['completed', FIXING, 'preview'],
  ] as const)('%s, standing at %o → %s', (status, view, frame) => {
    expect(importWizardFrame(status as CatalogImportState | null, view)).toBe(frame);
  });

  it('a state added later draws the report it cannot run past', () => {
    expect(importWizardFrame('archived' as CatalogImportState, IMPORT_WIZARD_START)).toBe('report');
  });
});

describe('importWizardStepIndex — the four steps the head names', () => {
  it.each([
    ['empty', 0],
    ['reading', 0],
    ['unreadable', 0],
    ['file', 0],
    ['columns', 1],
    ['matching', 1],
    ['preview', 2],
    ['running', 3],
    ['report', 3],
  ] as const)('%s is step %i', (frame, step) => {
    expect(importWizardStepIndex(frame)).toBe(step);
  });
});

describe('importWizardViewAfter — the person moving between steps', () => {
  it.each([
    ['continue from the file', AT_FILE, 'file', { type: 'continued' }, AT_COLUMNS],
    [
      'continue from a job just read',
      IMPORT_WIZARD_START,
      'file',
      { type: 'continued' },
      AT_COLUMNS,
    ],
    [
      'continue elsewhere',
      IMPORT_WIZARD_START,
      'preview',
      { type: 'continued' },
      IMPORT_WIZARD_START,
    ],
    ['confirm the columns', AT_COLUMNS, 'columns', { type: 'mapped' }, IMPORT_WIZARD_START],
    ['back from the columns', AT_COLUMNS, 'columns', { type: 'back' }, AT_FILE],
    ['back from the wait', IMPORT_WIZARD_START, 'matching', { type: 'back' }, AT_COLUMNS],
    ['back from the preview', IMPORT_WIZARD_START, 'preview', { type: 'back' }, AT_COLUMNS],
    ['back from the file', AT_FILE, 'file', { type: 'back' }, AT_FILE],
    ['back from the fix scope', FIXING, 'preview', { type: 'back' }, IMPORT_WIZARD_START],
    ['fix the open rows', IMPORT_WIZARD_START, 'report', { type: 'fix_opened' }, FIXING],
    ['run', FIXING, 'preview', { type: 'ran' }, IMPORT_WIZARD_START],
    ['replace the file', AT_COLUMNS, 'columns', { type: 'replaced' }, IMPORT_WIZARD_START],
  ] as const)('%s', (_, view, frame, event, after) => {
    expect(
      importWizardViewAfter(view, frame as ImportWizardFrame, event as ImportWizardEvent),
    ).toEqual(after);
  });
});

describe('importContinueGate — why a step cannot go on yet', () => {
  it.each([
    ['empty', null, 'no_file'],
    ['reading', null, 'reading'],
    ['unreadable', null, 'unreadable'],
    ['file', null, null],
    ['columns', ['brand', 'model', 'rate'], null],
    ['columns', ['brand', 'model', null], 'columns_unplaced'],
    ['columns', ['brand', 'brand', 'model', 'rate'], 'columns_twice'],
    ['matching', null, 'matching'],
    ['preview', null, null],
    ['running', null, null],
    ['report', null, null],
  ] as const)('%s with columns %o → %s', (frame, columns, gate) => {
    expect(importContinueGate(frame, columns ?? [])).toBe(gate);
  });
});

describe('importListStep — which lists a frame reads', () => {
  it.each([
    ['preview', 'previewed', 'preview'],
    ['preview', 'completed', 'fix'],
    ['report', 'completed', 'report'],
    ['columns', 'previewed', null],
    ['running', 'running', null],
    ['empty', null, null],
  ] as const)('%s of a %s job → %s', (frame, status, step) => {
    expect(importListStep(frame, status)).toBe(step);
  });
});
