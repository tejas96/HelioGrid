import type { NextStep } from '@heliogrid/domain';
import { type Ref, type RefObject, useImperativeHandle, useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import {
  heroActOf,
  isPrimaryNext,
  isViewOnly,
  nextPlaceOf,
  packFileOf,
  proofRowOf,
  samePlace,
} from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { nextGlyphOf } from './ProjectHero.glyph';
import './ProjectHero.css';

/**
 * The one hero: the stage and the day it entered, the days figure — the honest number, never a %
 * (`M08-12`) — then the one next step and its act, drawn only where the reader may take it. A closed
 * project says how it closed instead, and a handed-over one offers its pack.
 */
export function ProjectHero(props: ProjectDetailProps) {
  const { project, view, words, heroFocus } = props;
  const act = useRef<FocusHandle>(null);
  const line = useRef<HTMLDivElement>(null);
  // Focus lands on the hero's act, else on its line: whichever the hero draws now.
  useImperativeHandle(heroFocus, () => ({
    focus: (options) => (act.current ?? line.current)?.focus(options),
  }));
  const refs = { act, line };
  return (
    <HeroPanel label={words.now}>
      <div className="hg-project-detail-hero-now">
        <div className="hg-project-detail-hero-stage">
          <span className="hg-project-detail-hero-stage-name">{words.stage(project.stage)}</span>
          <span className="hg-project-detail-on-panel">{words.since(project.enteredOn)}</span>
        </div>
        <div className="hg-project-detail-hero-days">
          <span className="hg-project-detail-hero-days-figure">{view.days}</span>
          <span className="hg-project-detail-on-panel">{words.daysHere(view.days)}</span>
        </div>
      </div>
      <span className="hg-project-detail-hero-rule" aria-hidden="true" />
      {view.closed ? <ClosedLine {...props} refs={refs} /> : <NextBlock {...props} refs={refs} />}
    </HeroPanel>
  );
}

/** Where the hero hands focus: its act's button, and its line for a hero with none. */
interface HeroRefs {
  readonly act: Ref<FocusHandle>;
  readonly line: RefObject<HTMLDivElement | null>;
}

/** The one next step, its act — or, for the seller, that they read it only. */
function NextBlock(props: ProjectDetailProps & { refs: HeroRefs }) {
  const { project, view, words, refs } = props;
  return (
    <>
      <div ref={refs.line} tabIndex={-1} className="hg-project-detail-hero-next hg-focus-target">
        <span className="hg-project-detail-overline">{words.next}</span>
        <span className="hg-project-detail-hero-next-title">
          {words.nextTitle(view.next, proofRowOf(project, view.next))}
        </span>
        <span className="hg-project-detail-on-panel">{words.nextLine(view.next)}</span>
      </div>
      {heroActOf(project, view) ? (
        <NextActs {...props} />
      ) : isViewOnly(project, view) ? (
        <p className="hg-project-detail-hero-view-only">
          <ShellGlyph name="eye" size="sm" tone="secondary" />
          {words.viewOnly}
        </p>
      ) : null}
    </>
  );
}

/** The hero's act — the next step's — and, when the install date has passed, who we wait on. */
function NextActs({
  project,
  view,
  words,
  onNext,
  onSteps,
  onWait,
  sending,
  uploading,
  refs,
}: ProjectDetailProps & { refs: HeroRefs }) {
  const { next } = view;
  const place = nextPlaceOf(next);
  const glyph = nextGlyphOf(next);
  const press = () => {
    if (sending) return;
    if (next.kind === 'steps') onSteps();
    else onNext(next);
  };
  return (
    <div className="hg-project-detail-hero-acts">
      <Button
        ref={refs.act}
        variant={isPrimaryNext(next) ? 'primary' : 'secondary'}
        icon={glyph === null ? null : <ShellGlyph name={glyph} size="md" tone={toneOf(next)} />}
        loading={place !== null && samePlace(uploading, place)}
        {...(place?.slotKey ? { spokenName: words.uploadRow(place.slotKey) } : {})}
        onClick={press}
      >
        {words.nextAct(next)}
      </Button>
      {next.kind === 'install_date_passed' && project.wait === null && project.acts.stages ? (
        <Button
          variant="secondary"
          onClick={() => {
            if (!sending) onWait();
          }}
        >
          {words.noWaitTitle}
        </Button>
      ) : null}
    </div>
  );
}

/** A primary act's glyph is the inverse ink; a secondary's the primary. */
function toneOf(step: NextStep): 'inverse' | 'primary' {
  return isPrimaryNext(step) ? 'inverse' : 'primary';
}

/** How a closed project closed: handed over on its day with its pack, or cancelled and why. */
function ClosedLine({ project, words, onOpenFile, refs }: ProjectDetailProps & { refs: HeroRefs }) {
  const pack = packFileOf(project);
  if (project.stage === 'cancelled') {
    return (
      <div ref={refs.line} tabIndex={-1} className="hg-project-detail-hero-next hg-focus-target">
        <span className="hg-project-detail-on-panel">
          {words.cancelledLine(project.cancel?.reason ?? '')}
        </span>
        {project.cancel?.note ? (
          <span className="hg-project-detail-hero-note">{project.cancel.note}</span>
        ) : null}
      </div>
    );
  }
  return (
    <>
      <div ref={refs.line} tabIndex={-1} className="hg-project-detail-hero-next hg-focus-target">
        <span className="hg-project-detail-on-panel">{words.handedOverOn(project.enteredOn)}</span>
      </div>
      {pack === null ? null : (
        <div className="hg-project-detail-hero-acts">
          <Button
            ref={refs.act}
            variant="secondary"
            icon={<ShellGlyph name="download" size="md" tone="primary" />}
            onClick={() => onOpenFile(pack)}
          >
            {words.handoverPack}
          </Button>
        </div>
      )}
    </>
  );
}
