'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioEditing, StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, RoofBar, StudioView } from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';
import {
  Button,
  ProvenanceTier,
  RollingNumber,
  ShellGlyph,
  type ShellGlyphName,
  useFormat,
} from '@heliogrid/ui';
import { type ReactNode, type Ref, useEffect, useRef } from 'react';

interface BarAct {
  readonly key: string;
  readonly label: TranslatedText;
  readonly kind: 'primary' | 'secondary';
  readonly icon: ShellGlyphName;
  readonly iconRight?: boolean;
  readonly off?: boolean;
  readonly onPress: () => void;
}

/** What the bar shows: its mark, title, sentence, tone and acts. */
interface BarView {
  readonly mark: ShellGlyphName;
  readonly title: ReactNode;
  readonly status: TranslatedText;
  readonly bad: boolean;
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
}

function drawingBar(bar: Extract<RoofBar, { kind: 'drawing' }>, facts: BarFacts): BarView {
  const { words, format, units, studio } = facts;
  const refusal = bar.refused === null ? null : words.drawRefusal(bar.refused);
  const lastEdge = bar.lastEdge === null ? null : format.roofLength(bar.lastEdge, units, true);
  return {
    mark: refusal === null ? 'pencil' : 'alert-circle',
    title: refusal?.title ?? words.drawTitle(bar.corners, bar.ghost),
    status: refusal?.line ?? words.drawLine(bar.corners, lastEdge, studio.helpers.square),
    bad: refusal !== null,
    acts: [
      {
        key: 'cancel',
        label: words.cancel,
        kind: 'secondary',
        icon: 'close',
        onPress: studio.moves.cancel,
      },
      {
        key: 'close',
        label: words.closeShape,
        kind: 'primary',
        icon: 'check',
        off: !bar.canClose,
        onPress: studio.moves.close,
      },
    ],
  };
}

/** The roofs' sentence: a refusal, what an act did, or what the view lets a person do. */
function roofsStatus(
  bar: Extract<RoofBar, { kind: 'roofs' }>,
  facts: BarFacts,
  shown: RoofWordsShown,
): TranslatedText {
  const { words } = facts;
  if (bar.live !== null) return words.editRefusal(bar.live, shown);
  if (facts.crowded && facts.studio.roofStep.kind === 'dragging') return words.dragCrowded;
  return words.roofLine(bar.said, bar.sizing, shown);
}

function roofsBar(bar: Extract<RoofBar, { kind: 'roofs' }>, facts: BarFacts): BarView {
  const { words, format, units, studio, view } = facts;
  const shown: RoofWordsShown = {
    length: (metres) => format.roofLength(metres, units, false),
    height: format.roofHeight(format.pack.storeyHeightM, units),
  };
  const area = words.roofArea(format.area(bar.area, units));
  const see3d: BarAct[] =
    studio.offer3d && view === 'top'
      ? [
          {
            key: '3d',
            label: words.seeIn3d,
            kind: 'secondary',
            icon: 'box',
            onPress: () => studio.moves.see('3d'),
          },
        ]
      : [];
  return {
    mark: bar.bad ? 'alert-circle' : 'check',
    // The area counts to its new value each time it changes: the number rolls, the words stand.
    title: (
      <>
        <span className="hg-studio-bar-area">
          <RollingNumber key={area} value={area} />
        </span>
        <span className="hg-studio-bar-tier">
          <ProvenanceTier tier={bar.tier} />
        </span>
      </>
    ),
    status: roofsStatus(bar, facts, shown),
    bad: bar.bad,
    acts: [
      ...see3d,
      {
        key: 'objects',
        label: words.addObjects,
        kind: 'primary',
        icon: 'chevron-right',
        iconRight: true,
        onPress: studio.moves.toObjects,
      },
    ],
  };
}

/** Before a roof: the site's name and where it is, and the one way to begin. */
function startBar(name: TranslatedText, place: string | null, facts: BarFacts): BarView {
  const { words, studio } = facts;
  const { picture } = studio;
  const noPicture = picture.kind === 'none';
  return {
    mark: noPicture ? 'ruler' : 'pencil',
    title: name,
    status: noPicture ? words.noPictureWhy(picture.reason) : words.roofNotSetUp(place),
    bad: false,
    acts: [
      {
        key: 'draw',
        label: noPicture ? words.drawOnGrid : words.drawMyself,
        kind: 'primary',
        icon: 'pencil',
        onPress: studio.moves.draw,
      },
    ],
  };
}

/** A reader who may not change the design: the same words, no acts, and who is editing. */
function readOnly(view: BarView, editing: StudioEditing, facts: BarFacts): BarView {
  const editor = editing.kind === 'view-only' ? editing.editor : null;
  const roofs = facts.studio.bar?.kind === 'roofs';
  return {
    ...view,
    mark: 'eye',
    acts: [],
    status: editor !== null && roofs ? facts.words.editingNow(editor.name) : view.status,
  };
}

/**
 * The one bottom bar of the roof step (`T-M05-002`, part b): a mark, the title — the site, what to
 * tap now, or the roofs' area with its tier — one sentence of where things stand, and the step's
 * acts. Before a roof: Draw myself (no picture: Draw on the grid). While drawing: Cancel and Close
 * shape. With a roof: See it in 3D once, and Add roof objects. A refusal takes the error colour.
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
}) {
  const format = useFormat();
  const facts: BarFacts = { studio, view, units, words, format, crowded };
  const { bar } = studio;
  let shown = startBar(name, place, facts);
  if (bar?.kind === 'drawing') shown = drawingBar(bar, facts);
  if (bar?.kind === 'roofs') shown = roofsBar(bar, facts);
  if (editing.kind !== 'editor') shown = readOnly(shown, editing, facts);
  const { mark, title, status, bad } = shown;
  const acts = part === 'status' ? [] : shown.acts;
  const actsHolder = useRef<HTMLSpanElement>(null);
  const kind = bar?.kind ?? 'start';
  // A bar act that swaps the bar (Draw myself, Close shape, Cancel) takes its own button away:
  // focus goes to the new bar's main act, never lost to the page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the bar's kind is what swaps the acts
  useEffect(() => {
    if (document.activeElement !== document.body) return;
    const holder = actsHolder.current;
    const next =
      holder?.querySelector<HTMLButtonElement>('button[data-variant="primary"]:not(:disabled)') ??
      holder?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    next?.focus();
  }, [kind]);
  return (
    <div
      ref={barRef}
      className="hg-studio-glass hg-studio-bar"
      data-tone={bad ? 'bad' : undefined}
      data-hidden={part === 'hidden'}
      inert={part === 'hidden'}
    >
      <span className="hg-studio-bar-mark" data-mark={mark} aria-hidden>
        <ShellGlyph name={mark} size="sm" />
      </span>
      <span className="hg-studio-bar-words">
        <span className="hg-studio-bar-name">{title}</span>
        <span className="hg-studio-bar-status" role="status">
          {status}
        </span>
      </span>
      {acts.length > 0 ? (
        <span ref={actsHolder} className="hg-studio-bar-acts">
          {acts.map((act) => {
            const icon = <ShellGlyph name={act.icon} size="sm" />;
            return (
              <Button
                key={act.key}
                variant={act.kind}
                size="md"
                disabled={act.off}
                onClick={act.onPress}
                {...(act.iconRight ? { iconRight: icon } : { icon })}
              >
                {act.label}
              </Button>
            );
          })}
        </span>
      ) : null}
    </div>
  );
}
