'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import {
  LINE_UP_LIFT_MAX_M,
  LINE_UP_STEP_M,
  type MeasurementSystem,
  SEE_THROUGH_MAX,
  SEE_THROUGH_STEP,
} from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  Chip,
  IconButton,
  SegmentedControl,
  ShellGlyph,
  Slider,
  Switch,
  useFormat,
} from '@heliogrid/ui';
import { type Ref, useId } from 'react';
import { LidarFootMessage } from './StudioLidarFootMessage';
import { StudioLidarKey } from './StudioLidarKey';
import { StudioPanelHead } from './StudioPanelHead';

const PER_CENT = 100;
const TENTHS = 10;

type Lidar = StudioScreen['lidar'];

interface MoveFacts {
  readonly studio: StudioScreen;
  readonly words: StudioCanvasWords;
  readonly units: MeasurementSystem;
  /** The view's turn from north up, in radians: an arrow's way on the ground. */
  readonly turnOf: () => number;
  readonly phone: boolean;
}

/**
 * Four 10 cm arrows as one small cross — up over left, down, right — turned by the view, so each
 * moves the way it points on the screen.
 */
function NudgeCross({
  name,
  labels,
  turnOf,
  onNudge,
}: {
  name: TranslatedText;
  labels: {
    readonly up: TranslatedText;
    readonly down: TranslatedText;
    readonly left: TranslatedText;
    readonly right: TranslatedText;
  };
  turnOf: () => number;
  onNudge: (way: { east: number; north: number }) => void;
}) {
  const go = (screenEast: number, screenNorth: number) => () => {
    const turn = turnOf();
    onNudge({
      east: screenEast * Math.cos(turn) - screenNorth * Math.sin(turn),
      north: screenEast * Math.sin(turn) + screenNorth * Math.cos(turn),
    });
  };
  return (
    <div className="hg-lidar-nudge">
      <span>{name}</span>
      <fieldset className="hg-lidar-cross" aria-label={name}>
        <IconButton label={labels.up} variant="ghost" onClick={go(0, 1)}>
          <ShellGlyph name="chevron-up" size="sm" />
        </IconButton>
        <IconButton label={labels.left} variant="ghost" onClick={go(-1, 0)}>
          <ShellGlyph name="chevron-left" size="sm" />
        </IconButton>
        <IconButton label={labels.right} variant="ghost" onClick={go(1, 0)}>
          <ShellGlyph name="chevron-right" size="sm" />
        </IconButton>
        <IconButton label={labels.down} variant="ghost" onClick={go(0, -1)}>
          <ShellGlyph name="chevron" size="sm" />
        </IconButton>
      </fieldset>
    </div>
  );
}

/** The one picked building's height: which of its roofs, then the studio's slider, or its slope. */
function HeightPart({ lidar, facts }: { lidar: Lidar; facts: MoveFacts }) {
  const t = useTranslate();
  const format = useFormat();
  const { words, units } = facts;
  const roof = lidar.heightRoof;
  if (roof === null) return null;
  const heightOf = (metres: number) => format.roofHeight(metres, units);
  const at = roof.choices.findIndex((choice) => choice.index === roof.index);
  return (
    <>
      {roof.choices.length > 1 ? (
        <SegmentedControl
          fill
          ariaLabel={words.lidarWhichRoof}
          value={String(at)}
          options={roof.choices.map((choice, i) => ({
            value: String(i),
            label: words.lidarRoofName(choice.name),
          }))}
          onChange={(value) => lidar.moves.heightRoof(Number(value))}
        />
      ) : null}
      {roof.flat ? (
        <Slider
          value={roof.heightM}
          min={roof.slide.min}
          max={roof.slide.max}
          step={roof.slide.step}
          label={words.lidarHeight}
          format={heightOf}
          words={sliderWords(t)}
          onCommit={lidar.moves.setHeight}
        />
      ) : (
        <p className="hg-lidar-stack">
          <span>{words.lidarSloped}</span>
          <span>
            {roof.range === null
              ? words.lidarNoScanRoof
              : words.lidarScanRange(heightOf(roof.range.lowM), heightOf(roof.range.highM))}
          </span>
        </p>
      )}
    </>
  );
}

/** Roofs: the buildings to pick, where they stand, Match the scan, the height, the arrows. */
function RoofsTab({ lidar, facts }: { lidar: Lidar; facts: MoveFacts }) {
  const format = useFormat();
  const { words, units } = facts;
  const { moves, status } = lidar;
  const any = lidar.picked.length > 0;
  // A distance is said to the 10 cm, as the arrows step.
  const metres = (value: number) => format.roofHeight(Math.round(value * TENTHS) / TENTHS, units);
  return (
    <div className="hg-lidar-part">
      <fieldset className="hg-lidar-chips" aria-label={words.lidarBuildings}>
        {lidar.buildings.map((building, i) => (
          <Chip
            key={building.roofs.join()}
            density="pick"
            active={building.picked}
            onClick={() => moves.pick(i)}
          >
            {words.lidarBuilding(building.names)}
          </Chip>
        ))}
        {any ? (
          <Chip density="pick" onClick={moves.pickNone}>
            {words.lidarNone}
          </Chip>
        ) : null}
      </fieldset>
      {any ? (
        <div className="hg-lidar-match">
          <span className="hg-lidar-status" role="status">
            {status === null ? null : words.lidarStatus(status, metres, metres)}
          </span>
          <Button variant="primary" size="sm" disabled={!lidar.canMatch} onClick={moves.match}>
            {words.lidarMatch}
          </Button>
        </div>
      ) : null}
      <HeightPart lidar={lidar} facts={facts} />
      {any ? (
        <NudgeCross
          name={words.lidarNudge}
          labels={{
            up: words.lidarRoofsUp,
            down: words.lidarRoofsDown,
            left: words.lidarRoofsLeft,
            right: words.lidarRoofsRight,
          }}
          turnOf={facts.turnOf}
          onNudge={moves.nudge}
        />
      ) : null}
      {lidar.changed ? (
        <Button variant="ghost" size="sm" onClick={moves.asDrawn}>
          {words.lidarAsDrawn}
        </Button>
      ) : null}
    </div>
  );
}

/** Map: Sunlight first, then see-through, the map's height, the arrows, Back to automatic. */
function MapTab({ lidar, facts }: { lidar: Lidar; facts: MoveFacts }) {
  const t = useTranslate();
  const format = useFormat();
  const { studio, words, units } = facts;
  const { site } = studio;
  const { view, moves } = lidar;
  const moved = studio.document?.site?.lineUp !== undefined;
  return (
    <div className="hg-lidar-part">
      <Switch
        label={words.siteSunlight}
        description={words.lidarSunlightLine}
        toggleAt="end"
        checked={view.sunlight}
        onChange={moves.sunlight}
      />
      {view.sunlight ? <StudioLidarKey studio={studio} words={words} inPanel /> : null}
      <Slider
        value={Math.round(view.seeThrough * PER_CENT)}
        min={0}
        max={SEE_THROUGH_MAX * PER_CENT}
        step={SEE_THROUGH_STEP * PER_CENT}
        label={words.siteSeeThrough}
        format={(value) => words.sitePercent(format.number(value))}
        words={sliderWords(t)}
        onInput={(value) => moves.seeThrough(value / PER_CENT)}
      />
      <Slider
        value={site.lineUp.lift}
        min={-LINE_UP_LIFT_MAX_M}
        max={LINE_UP_LIFT_MAX_M}
        step={LINE_UP_STEP_M}
        label={words.siteLineUpLift}
        format={(metres) => format.fineLength(metres, units)}
        words={sliderWords(t)}
        onCommit={site.liftMap}
      />
      <NudgeCross
        name={words.lidarNudge}
        labels={{
          up: words.siteMapUp,
          down: words.siteMapDown,
          left: words.siteMapLeft,
          right: words.siteMapRight,
        }}
        turnOf={facts.turnOf}
        onNudge={site.nudgeMap}
      />
      <Button variant="ghost" size="sm" disabled={!moved} onClick={site.mapBack}>
        {words.siteMapBack}
      </Button>
    </div>
  );
}

/**
 * Move (`T-M05-002g`, board frames 10–15): one sheet at the foot, between the tool columns, at most
 * 40 % of the screen high — Roofs | Map. Its head and tabs stay; only the body scrolls, and each
 * tab opens at its top. A reader gets a roof's card instead: its height, the scan's, its sunlight.
 */
export function StudioLidarMove(
  facts: MoveFacts & { readonly footRef: Ref<HTMLDivElement> | null },
) {
  const { studio, words, units } = facts;
  const format = useFormat();
  const title = useId();
  const { lidar } = studio;
  const { view, moves, card } = lidar;
  if (!view.on || view.move === null || lidar.scan !== 'in') return null;
  if (!lidar.canEdit) {
    if (card === null) return null;
    return (
      <div ref={facts.footRef} className="hg-lidar-sheet">
        <section
          className="hg-studio-glass hg-studio-view-panel hg-lidar-move hg-lidar-card"
          aria-labelledby={title}
        >
          <StudioPanelHead
            id={title}
            title={words.lidarRoofName(card.name)}
            closeLabel={words.sheetClose}
            onClose={moves.move}
          />
          <dl className="hg-lidar-facts">
            <dt>{words.lidarCardHeight}</dt>
            <dd>{format.roofHeight(card.heightM, units)}</dd>
            <dt>{words.lidarCardScan}</dt>
            <dd>
              {card.scanM === null ? words.lidarCardNoRoof : format.roofHeight(card.scanM, units)}
            </dd>
            {view.sunlight && card.share !== null ? (
              <>
                <dt>{words.lidarCardSun}</dt>
                <dd>{words.sitePercent(format.number(Math.round(card.share * PER_CENT)))}</dd>
              </>
            ) : null}
          </dl>
        </section>
      </div>
    );
  }
  const tab = view.move.tab;
  return (
    <div ref={facts.footRef} className="hg-lidar-sheet">
      <LidarFootMessage studio={studio} words={words} phone={facts.phone} />
      <section
        className="hg-studio-glass hg-studio-view-panel hg-lidar-move"
        aria-labelledby={title}
      >
        <div className="hg-lidar-move-head">
          <StudioPanelHead
            id={title}
            title={words.lidarMove}
            closeLabel={words.lidarMoveClose}
            onClose={moves.move}
          />
          <SegmentedControl
            fill
            ariaLabel={words.lidarWhatToMove}
            value={tab}
            options={[
              { value: 'roofs', label: words.lidarTabRoofs },
              { value: 'map', label: words.lidarTabMap },
            ]}
            onChange={(next) => moves.tab(next === 'map' ? 'map' : 'roofs')}
          />
        </div>
        {/* A new tab is a new body, so it opens at its top. */}
        <div className="hg-lidar-move-body" key={tab}>
          {tab === 'roofs' ? (
            <RoofsTab lidar={lidar} facts={facts} />
          ) : (
            <MapTab lidar={lidar} facts={facts} />
          )}
        </div>
      </section>
    </div>
  );
}
