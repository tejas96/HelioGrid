'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioEditing, StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, RoofBar, StudioView } from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';
import {
  Button,
  IconButton,
  RollingNumber,
  ShellGlyph,
  type ShellGlyphName,
  useFormat,
} from '@heliogrid/ui';
import { type ReactNode, type Ref, useEffect, useRef } from 'react';
import { roofWordsShown } from './roof-words-shown';
import { BAR_TOOL, MagnetRefused, MagnetSwitch, pillOf } from './StudioBarPills';

interface BarAct {
  readonly key: string;
  readonly label: TranslatedText;
  readonly icon?: ShellGlyphName;
  /** The bar's main act is primary; one beside it is secondary. */
  readonly secondary?: boolean;
  readonly onPress: () => void;
}

/** What the bar shows: its mark, title, sentence, tone, round tools and acts. */
interface BarView {
  readonly mark: ShellGlyphName;
  readonly title: ReactNode;
  readonly status: TranslatedText;
  readonly bad: boolean;
  readonly tools?: ReactNode;
  readonly acts: readonly BarAct[];
}

type Format = ReturnType<typeof useFormat>;

interface BarFacts {
  readonly studio: StudioScreen;
  readonly view: StudioView;
  readonly units: MeasurementSystem;
  readonly words: StudioCanvasWords;
  readonly format: Format;
  /** The corner held is crowded by another on the screen. */
  readonly crowded: boolean;
  /** The reader may change the design. */
  readonly editable: boolean;
  readonly part: FocusParts['bottomBar'];
  /** Focus mode's magnet: shown while drawing, `picked` with a roof picked. */
  readonly magnetPart: FocusParts['magnet'];
}

/** The roofs' sentence: a refusal, what an act did, or what the view lets a person do. */
function roofsStatus(
  bar: Extract<RoofBar, { kind: 'roofs' }>,
  facts: BarFacts,
  shown: RoofWordsShown,
): TranslatedText {
  const { words } = facts;
  if (bar.live !== null) return words.editRefusal(bar.live, shown, bar.liveHeld);
  if (facts.crowded && facts.studio.roofStep.kind === 'dragging') return words.dragCrowded;
  // Undo and Redo name themselves in every view.
  const kind = bar.said?.kind;
  if (kind === 'undone' || kind === 'redone') return words.roofLine(bar.said, false, shown);
  // In 3D the outline is not changed: what a person does here is a roof's height — or, for a
  // reader, looks at it.
  if (facts.view !== 'top') return facts.editable ? words.roofIdle3d : words.roofIdle3dReader;
  return words.roofLine(bar.said, bar.sizing, shown);
}

function roofsBar(bar: Extract<RoofBar, { kind: 'roofs' }>, facts: BarFacts): BarView {
  const { words, format, units, studio, view } = facts;
  const shown = roofWordsShown(format, units);
  const area = words.roofArea(format.area(bar.area, units));
  // A roof picked in the top view: the magnet for the drags to come, and the trash that deletes it.
  const picked = facts.editable && view === 'top' && bar.picked !== null;
  const tools = picked ? (
    <>
      {facts.magnetPart === 'picked' ? <MagnetSwitch studio={studio} words={words} /> : null}
      <MagnetRefused studio={studio} words={words} />
      <IconButton label={words.deleteRoof} size={BAR_TOOL} onClick={studio.moves.deleteRoof}>
        <ShellGlyph name="trash" size="md" />
      </IconButton>
    </>
  ) : null;
  return {
    mark: bar.bad ? 'alert-circle' : 'check',
    // The area counts to its new value each time it changes: the number rolls, the words stand.
    title: (
      <span className="hg-studio-bar-area">
        <RollingNumber key={area} value={area} />
      </span>
    ),
    status: roofsStatus(bar, facts, shown),
    bad: bar.bad,
    tools,
    // No acts: the next step is the steps' › in the head, and 3D is the tools' switch, never a
    // second way here.
    acts: [],
  };
}

/** Before a roof: the site's name and where it is, and the one way to begin. */
function startBar(name: TranslatedText, place: string | null, facts: BarFacts): BarView {
  const { words, studio, format, units } = facts;
  const { picture, bar } = studio;
  const noPicture = picture.kind === 'none';
  // The last roof just deleted: the bar says so, and Undo brings it back.
  const said = bar?.kind === 'start' ? bar.said : null;
  const why = noPicture ? words.noPictureWhy(picture.reason) : words.roofNotSetUp(place);
  return {
    mark: noPicture ? 'ruler' : 'pencil',
    title: name,
    status: said === null ? why : words.roofLine(said, false, roofWordsShown(format, units)),
    bad: false,
    // With no picture, typing the size is the main way; drawing on the grid sits beside it.
    acts: noPicture
      ? [
          {
            key: 'draw',
            label: words.drawOnGrid,
            icon: 'pencil',
            secondary: true,
            onPress: studio.moves.draw,
          },
          { key: 'type', label: words.typeSize, onPress: studio.moves.typeSize },
        ]
      : [{ key: 'draw', label: words.drawMyself, icon: 'pencil', onPress: studio.moves.draw }],
  };
}

/** A reader who may not change the design: the same words, no acts, and who is editing. */
function readOnly(view: BarView, editing: StudioEditing, facts: BarFacts): BarView {
  const editor = editing.kind === 'view-only' ? editing.editor : null;
  const roofs = facts.studio.bar?.kind === 'roofs';
  return {
    ...view,
    mark: 'eye',
    tools: null,
    acts: [],
    status: editor !== null && roofs ? facts.words.editingNow(editor.name) : view.status,
  };
}

/**
 * The one bottom bar of the roof step (`T-M05-002`, part b): a mark, the title — the site, what to
 * tap now, or the roofs' area — one sentence of where things stand, and the step's
 * acts. Before a roof: Draw myself (no picture: Draw on the grid). While drawing, a slim pill
 * instead: the magnet and Close shape. A closed roof stands at once — Undo takes it back. With a
 * roof: no acts; a roof picked adds the magnet and its trash. A refusal takes the error colour.
 */
export function StudioBottomBar({
  barRef,
  name,
  studio,
  view,
  units,
  editing,
  place,
  words,
  part,
  crowded,
  magnet,
  phone,
}: {
  barRef: Ref<HTMLDivElement>;
  name: TranslatedText;
  studio: StudioScreen;
  view: StudioView;
  units: MeasurementSystem;
  editing: StudioEditing;
  /** The site's place, which the bar names before a roof. */
  place: string | null;
  words: StudioCanvasWords;
  /** Focus mode: the whole bar, its status line alone, or none. */
  part: FocusParts['bottomBar'];
  /** The corner held is crowded by another on the screen: the bar asks for a closer look. */
  crowded: boolean;
  /** Focus mode's magnet. */
  magnet: FocusParts['magnet'];
  /** A phone-width screen, where the keyboard covers the foot. */
  phone: boolean;
}) {
  const format = useFormat();
  const editable = editing.kind === 'editor';
  const facts: BarFacts = {
    studio,
    view,
    units,
    words,
    format,
    crowded,
    editable,
    part,
    magnetPart: magnet,
  };
  const { bar } = studio;
  const pill = pillOf(studio, words, part === 'hidden', phone);
  let shown = startBar(name, place, facts);
  if (bar?.kind === 'roofs') shown = roofsBar(bar, facts);
  // Your picture's line (`T-M05-002d`): what to do next with it, or what an act just did. Before a
  // roof the pencil and the outlines are the way in, so the bar holds no act of its own.
  const say = studio.own.say;
  if (say !== null) {
    shown = { ...shown, status: words.ownSay(say), acts: bar?.kind === 'roofs' ? shown.acts : [] };
  }
  if (!editable) shown = readOnly(shown, editing, facts);
  const { mark, title, status, bad } = shown;
  const acts = part === 'status' ? [] : shown.acts;
  const tools = part === 'status' ? null : shown.tools;
  const actsHolder = useRef<HTMLSpanElement>(null);
  const kind = pill === null ? (bar?.kind ?? 'start') : `pill-${bar?.kind}`;
  // A bar act that swaps the bar (Draw myself, Close shape, Cancel) takes its own button away:
  // focus goes to the new bar's main act, never lost to the page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the bar's kind is what swaps the acts
  useEffect(() => {
    if (document.activeElement !== document.body) return;
    const holder = actsHolder.current;
    const next =
      holder?.querySelector<HTMLButtonElement>('button[data-variant="primary"]:not(:disabled)') ??
      holder?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    // A bar with no act of its own (a pill's Lock, Hide or Remove just done) takes focus itself.
    (next ?? document.querySelector<HTMLElement>('.hg-studio-bar.hg-focus-target'))?.focus();
  }, [kind]);
  // The size card holds Place roof while the phone's keyboard covers the foot: nothing shows here.
  if (pill === null && bar?.kind === 'typing') {
    return <div ref={barRef} className="hg-studio-glass hg-studio-bar" data-hidden="true" inert />;
  }
  if (pill !== null) {
    return (
      <div ref={barRef} className="hg-studio-glass hg-studio-bar" data-kind="pill">
        <span ref={actsHolder} className="hg-studio-bar-acts">
          {pill}
        </span>
      </div>
    );
  }
  return (
    <div
      ref={barRef}
      className="hg-studio-glass hg-studio-bar hg-focus-target"
      tabIndex={-1}
      data-tone={bad ? 'bad' : undefined}
      data-hidden={part === 'hidden'}
      inert={part === 'hidden'}
    >
      <span className="hg-studio-bar-mark" data-mark={mark} aria-hidden>
        <ShellGlyph name={mark} size="sm" />
      </span>
      <span className="hg-studio-bar-words">
        <span className="hg-studio-bar-name">{title}</span>
        {/* The live region stays; a new sentence inside it is a new line, and slides in. */}
        <span className="hg-studio-bar-status" role="status">
          <span key={String(status)} className="hg-studio-bar-line">
            {status}
          </span>
        </span>
      </span>
      {acts.length > 0 || tools ? (
        <span ref={actsHolder} className="hg-studio-bar-acts">
          {tools}
          {acts.map((act) => (
            <Button
              key={act.key}
              variant={act.secondary ? 'secondary' : 'primary'}
              size="md"
              onClick={act.onPress}
              icon={act.icon === undefined ? undefined : <ShellGlyph name={act.icon} size="sm" />}
            >
              {act.label}
            </Button>
          ))}
        </span>
      ) : null}
    </div>
  );
}
