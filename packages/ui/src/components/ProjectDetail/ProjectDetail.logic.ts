import type {
  ProjectDetail as ProjectDetailFacts,
  ProjectFile,
  TranslatedText,
} from '@heliogrid/contracts';
import {
  daysFrom,
  type JourneyRow,
  type NextStep,
  PROJECT_STAGE_CHAIN,
  type ProjectDetailView,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HueTileTone } from '../HueTile/HueTile.types';
import type { MenuItem } from '../Menu/Menu.types';
import type { TimelineItem } from '../Timeline/Timeline.types';
import type { ProjectHeadProps } from './ProjectDetail.parts.types';
import type {
  ProjectDetailProps,
  ProjectDetailWords,
  ProjectFilePlace,
  ProjectMenuAct,
} from './ProjectDetail.types';

type ProjectDocument = ProjectDetailFacts['documents'][number];

/** The page lays its two columns side by side from this much room of its own (px). */
export const WIDE_FROM = 900;

/** The acts the hero's button takes; the ones that are a person's to do now draw it primary. */
export function isPrimaryNext(step: NextStep): boolean {
  return !['steps', 'handed_over', 'cancelled'].includes(step.kind);
}

/** Whether the hero's act is one the reader's grant reaches. */
function nextNeeds(step: NextStep): 'stages' | 'documents' {
  return step.kind === 'upload_missing' || step.kind === 'upload_proof' ? 'documents' : 'stages';
}

export function samePlace(a: ProjectFilePlace | null, b: ProjectFilePlace): boolean {
  return a !== null && a.slot === b.slot && a.slotKey === b.slotKey;
}

/** The place the hero's act uploads to, when its act is an upload. */
export function nextPlaceOf(step: NextStep): ProjectFilePlace | null {
  return step.kind === 'upload_missing' || step.kind === 'upload_proof'
    ? { slot: 'document', slotKey: step.row }
    : null;
}

/**
 * The hero draws its act only where the reader may take it, and never on a closed project. The
 * steps are a read: anyone who sees the project may open them.
 */
export function heroActOf(project: ProjectDetailFacts, view: ProjectDetailView): boolean {
  if (view.closed) return false;
  return view.next.kind === 'steps' || project.acts[nextNeeds(view.next)];
}

/** A reader who may take no act on a live project reads it only — the seller, by the scope rules. */
export function isViewOnly(project: ProjectDetailFacts, view: ProjectDetailView): boolean {
  return !view.closed && !project.acts.stages && !project.acts.documents && !project.acts.steps;
}

/** The checklist row whose file came early and asks the move, where a row proves that stage. */
export function proofRowOf(project: ProjectDetailFacts, step: NextStep): string | null {
  if (step.kind !== 'confirm_proof') return null;
  return project.documents.find((document) => document.movesTo === step.to)?.row ?? null;
}

/** The handover pack's file — made at handover — once there is one. */
export function packFileOf(project: ProjectDetailFacts): ProjectFile | null {
  return project.documents.find((document) => document.madeBy === 'handover')?.files.at(-1) ?? null;
}

/** The days the open wait has run, counted on the company's day. */
export function waitDaysOf(project: ProjectDetailFacts): number {
  return project.wait === null ? 0 : daysFrom(project.wait.startedOn, project.today);
}

/** Who a project waits on, as its tile's glyph. */
export const PARTY_GLYPH: Readonly<Record<string, ShellGlyphName>> = {
  company: 'building',
  customer: 'person',
  utility: 'bolt',
  material: 'package',
};

/** A person's first name, as the *Call* button says it; the name itself when it is one word. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** The rows the project page shows of its checklist: three still waiting, or every row. */
export const WAITING_SHOWN = 3;

export function documentRowsOf(
  project: ProjectDetailFacts,
  view: ProjectDetailView,
  rows: 'waiting' | 'all',
): readonly ProjectDocument[] {
  if (rows === 'all') return project.documents;
  return view.documentsWaiting
    .slice(0, WAITING_SHOWN)
    .flatMap((row) => project.documents.filter((document) => document.row === row));
}

/** The row whose file moves the project to its next stage, where one does — the checklist's hero. */
export function provingRowOf(
  view: ProjectDetailView,
): { readonly row: string; readonly to: string } | null {
  const { next } = view;
  if (next.kind !== 'upload_proof') return null;
  return { row: next.row, to: next.to };
}

/** The glyph's stroke on a project's tiles: a row's and a card's, as the board draws them. */
export const TILE_STROKE = glyphStroke('md');

/** A document's tile: done reads the success wash, the rest the neutral fill. */
export function documentToneOf(document: ProjectDocument): HueTileTone {
  return document.state === 'done' ? 'success' : 'neutral';
}

/**
 * The journey as the timeline draws it: a stage passed with its date and who or what moved it,
 * where it stands with its days, what moves each stage ahead, a stage a proof moved it over, and a
 * stage this deal does not walk. A key is set only with its value — on the phone an `undefined`
 * would erase a default beneath it.
 */
export function journeyItemsOf(
  { project, view, words }: Pick<ProjectDetailProps, 'project' | 'view' | 'words'>,
  format: MarketFormat,
  sun: ReactNode,
): TimelineItem[] {
  return view.journey.map((row): TimelineItem => {
    const label = words.stage(row.stage);
    const quiet = quietStageOf(row, label, words);
    if (quiet !== null) return quiet;
    if (row.state === 'next') {
      const proving = project.documents.find((document) => document.movesTo === row.stage);
      const description = words.movesOn(row.stage, proving?.row ?? null);
      return { id: row.stage, label, status: 'upcoming', description };
    }
    if (row.state === 'now') {
      return {
        id: row.stage,
        label,
        status: 'current',
        icon: sun,
        meta: words.days(view.days),
        ...(row.on === null ? {} : { description: words.since(row.on) }),
      };
    }
    return {
      id: row.stage,
      label,
      status: 'done',
      ...(row.on === null ? {} : { meta: format.date(row.on) }),
      ...movedByOf(row, project, words),
    };
  });
}

/**
 * A stage the project walks past rather than through: one this deal does not walk, one a proof
 * moved it over, and one a cancelled project never reaches — with no hint of what would move it on.
 */
function quietStageOf(
  row: JourneyRow,
  label: TranslatedText,
  words: ProjectDetailWords,
): TimelineItem | null {
  switch (row.state) {
    case 'skipped':
      return {
        id: row.stage,
        label,
        status: 'skipped',
        meta: words.passedOver,
        description: words.passedOverLine,
      };
    case 'passed':
      return { id: row.stage, label, status: 'skipped', meta: words.countsAsPassed };
    case 'not_reached':
      return { id: row.stage, label, status: 'upcoming' };
    default:
      return null;
  }
}

/**
 * Who or what moved a stage reached: the proof that landed — the system's own line — the person who
 * marked the deal won, the person who sent the crew with the crew's names, or the person who tapped.
 */
function movedByOf(
  row: JourneyRow,
  project: ProjectDetailFacts,
  words: ProjectDetailWords,
): Pick<TimelineItem, 'description' | 'descriptionTone'> {
  if (row.cause === 'proof') {
    return { description: words.movedByProof(row.proof), descriptionTone: 'system' };
  }
  if (row.by === null) return {};
  if (row.stage === 'won') return { description: words.byMarkWon(row.by) };
  if (row.stage === 'dispatched' && project.crew.length > 0) {
    const crew = project.crew.map((member) => member.name);
    return { description: words.byWithCrew(row.by, crew) };
  }
  return { description: words.movedBy(row.by) };
}

/** Each safe act's glyph in the ⋯; cancel draws the menu's own trash, as every destructive row does. */
const MENU_GLYPH: Record<Exclude<ProjectMenuAct, 'cancel'>, ShellGlyphName> = {
  date: 'calendar',
  manager: 'person',
  access: 'key',
  moveBack: 'undo',
};

/**
 * The ⋯ beside the title: what a reader who moves stages may change on a live project — the date,
 * the manager, how to get in, one stage back where there is one — and cancel last. None, no menu.
 */
export function projectMenuOf(
  { project, view, words, onMenu }: ProjectHeadProps,
  glyph: (name: ShellGlyphName) => ReactNode,
): MenuItem[] | null {
  if (view.closed || !project.acts.stages) return null;
  const label: Record<ProjectMenuAct, TranslatedText> = {
    date: words.changeDate,
    manager: words.changeManager,
    access: words.changeAccess,
    moveBack: words.moveBack,
    cancel: words.cancel,
  };
  const acts: readonly Exclude<ProjectMenuAct, 'cancel'>[] = view.canMoveBack
    ? ['date', 'manager', 'access', 'moveBack']
    : ['date', 'manager', 'access'];
  return [
    ...acts.map((act) => ({
      key: act,
      label: label[act],
      icon: glyph(MENU_GLYPH[act]),
      onSelect: () => onMenu(act),
    })),
    { key: 'cancel', label: label.cancel, destructive: true, onSelect: () => onMenu('cancel') },
  ];
}

/**
 * The install fact as its pill says it: the date promised before the crew starts, the steps ticked
 * while they work, and the day the last tick moved it on once they are done.
 */
export function installFactOf({ project, words }: Pick<ProjectHeadProps, 'project' | 'words'>): {
  readonly glyph: ShellGlyphName;
  readonly label: TranslatedText;
} {
  const ticked = project.steps.filter((step) => step.tickedAt !== null).length;
  if (project.stage === 'installation') {
    return { glyph: 'wrench', label: words.installing(ticked, project.steps.length) };
  }
  const chain: readonly string[] = PROJECT_STAGE_CHAIN;
  const pastInstall = chain.indexOf(project.stage) > chain.indexOf('installation');
  const installed = [...project.journey]
    .reverse()
    .find((move) => move.to === 'electrical_metering');
  if (pastInstall && installed !== undefined) {
    return { glyph: 'wrench', label: words.installedOn(installed.enteredOn) };
  }
  return { glyph: 'calendar', label: words.installBy(project.expectedInstallOn) };
}
