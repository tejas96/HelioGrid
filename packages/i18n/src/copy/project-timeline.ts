import type { KnownActivity, TranslatedText } from '@heliogrid/contracts';
import { chainIndexOf, type ProjectStage } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

/**
 * A project's entries in the one stream its lead shows (`M08-17`): every stage, party, reason, row
 * and step is the market pack's word in the reader's language (`formats.word`).
 */
type T = Translator['t'];

type ProjectKind =
  | 'project_moved'
  | 'project_wait'
  | 'project_document'
  | 'project_step'
  | 'project_changed';
type ProjectEntry = Extract<KnownActivity, { kind: ProjectKind }>;
type EntryOf<K extends ProjectEntry['kind']> = Extract<ProjectEntry, { kind: K }>['body'];

interface ProjectEntryFormats {
  readonly word: (kind: 'stage' | 'party' | 'reason' | 'row' | 'step', key: string) => string;
  readonly day: (date: string) => string;
}

const PROJECT_ENTRY = {
  started: /*i18n*/ { id: 'Project started at {stage}' },
  movedTo: /*i18n*/ { id: 'Project moved to {stage}' },
  movedBack: /*i18n*/ { id: 'Project moved back to {stage}' },
  undone: /*i18n*/ { id: 'Move undone · back at {stage}' },
  byProof: /*i18n*/ { id: 'Moved by HelioGrid · {proof}' },
  firstStep: /*i18n*/ { id: 'the first install step was ticked' },
  lastStep: /*i18n*/ { id: 'the last install step was ticked' },
  cancelled: /*i18n*/ { id: 'Project cancelled' },
  handedOver: /*i18n*/ { id: 'Project handed over' },
  waitStarted: /*i18n*/ { id: 'Waiting on {party} · {reason}' },
  waitSince: /*i18n*/ { id: 'Since {date}' },
  waitOver: /*i18n*/ { id: 'Wait on {party} is over' },
  waitClosedByMove: /*i18n*/ { id: 'Closed when the project moved on' },
  documentDone: /*i18n*/ { id: '{row} done' },
  documentNotNeeded: /*i18n*/ { id: '{row} not needed' },
  documentWaiting: /*i18n*/ { id: '{row} waiting again' },
  stepTicked: /*i18n*/ { id: '{step} ticked' },
  stepUnticked: /*i18n*/ { id: '{step} tick taken back' },
  doneBy: /*i18n*/ { id: 'Done by {name}' },
  managerChanged: /*i18n*/ { id: 'Project manager changed' },
  installDateChanged: /*i18n*/ { id: 'Install date changed' },
  crewPicked: /*i18n*/ { id: 'Crew picked' },
  accessNoteChanged: /*i18n*/ { id: 'How to get in changed' },
  fileShownChanged: /*i18n*/ { id: 'A file’s place in the handover pack changed' },
} satisfies Record<string, MessageRef>;

const CHANGED: Readonly<Record<string, MessageRef>> = {
  manager: PROJECT_ENTRY.managerChanged,
  install_date: PROJECT_ENTRY.installDateChanged,
  crew: PROJECT_ENTRY.crewPicked,
  access_note: PROJECT_ENTRY.accessNoteChanged,
  file_shown: PROJECT_ENTRY.fileShownChanged,
};

interface Line {
  readonly summary: TranslatedText;
  readonly detail: TranslatedText | null;
}

const line = (summary: TranslatedText, detail: TranslatedText | null = null): Line => ({
  summary,
  detail,
});

function moved(t: T, formats: ProjectEntryFormats, body: EntryOf<'project_moved'>): Line {
  const stage = formats.word('stage', body.to);
  if (body.to === 'cancelled') return line(t(PROJECT_ENTRY.cancelled));
  if (body.to === 'handed_over') return line(t(PROJECT_ENTRY.handedOver));
  if (body.from === null) return line(t(PROJECT_ENTRY.started, { stage }));
  if (body.cause === 'undo') return line(t(PROJECT_ENTRY.undone, { stage }));
  if (body.cause === 'proof') {
    const proof =
      body.proof === 'first_install_step'
        ? t(PROJECT_ENTRY.firstStep)
        : body.proof === 'last_install_step'
          ? t(PROJECT_ENTRY.lastStep)
          : formats.word('row', body.proof ?? '');
    return line(t(PROJECT_ENTRY.movedTo, { stage }), t(PROJECT_ENTRY.byProof, { proof }));
  }
  const back = chainIndexOf(body.to as ProjectStage) < chainIndexOf(body.from as ProjectStage);
  return line(t(back ? PROJECT_ENTRY.movedBack : PROJECT_ENTRY.movedTo, { stage }));
}

function waitEntry(t: T, formats: ProjectEntryFormats, body: EntryOf<'project_wait'>): Line {
  const party = formats.word('party', body.party);
  if (body.ended === null) {
    return line(
      t(PROJECT_ENTRY.waitStarted, { party, reason: formats.word('reason', body.reason) }),
      t(PROJECT_ENTRY.waitSince, { date: formats.day(body.startedOn) }),
    );
  }
  return line(
    t(PROJECT_ENTRY.waitOver, { party }),
    body.ended === 'person' ? null : t(PROJECT_ENTRY.waitClosedByMove),
  );
}

/** A row's new state; one this build does not know reads as waiting. */
const DOCUMENT_ENTRY: Readonly<Record<string, MessageRef>> = {
  done: PROJECT_ENTRY.documentDone,
  not_needed: PROJECT_ENTRY.documentNotNeeded,
};

function documentEntry(
  t: T,
  formats: ProjectEntryFormats,
  body: EntryOf<'project_document'>,
): Line {
  return line(
    t(DOCUMENT_ENTRY[body.state] ?? PROJECT_ENTRY.documentWaiting, {
      row: formats.word('row', body.row),
    }),
    body.fileName === null ? null : shownAsSent(body.fileName),
  );
}

function stepEntry(t: T, formats: ProjectEntryFormats, body: EntryOf<'project_step'>): Line {
  const step = formats.word('step', body.step);
  return line(
    t(body.ticked ? PROJECT_ENTRY.stepTicked : PROJECT_ENTRY.stepUnticked, { step }),
    body.doneBy === null ? null : t(PROJECT_ENTRY.doneBy, { name: body.doneBy }),
  );
}

/** A project entry's words, in the reader's language. */
export function projectEntryWords(t: T, formats: ProjectEntryFormats, entry: ProjectEntry): Line {
  switch (entry.kind) {
    case 'project_moved':
      return moved(t, formats, entry.body);
    case 'project_wait':
      return waitEntry(t, formats, entry.body);
    case 'project_document':
      return documentEntry(t, formats, entry.body);
    case 'project_step':
      return stepEntry(t, formats, entry.body);
    case 'project_changed': {
      const words = CHANGED[entry.body.field];
      return line(words === undefined ? shownAsSent(entry.body.field) : t(words));
    }
  }
}
