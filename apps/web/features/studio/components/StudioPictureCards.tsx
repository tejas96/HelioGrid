'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { PlanShown, StudioScreen, UnitCard } from '@heliogrid/data/react';
import {
  PICTURE_TURN_STEP_DEG,
  PLAN_SEE_THROUGH_MAX,
  PLAN_SEE_THROUGH_MIN,
  PLAN_SEE_THROUGH_STEP,
} from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { IconButton, SegmentedControl, ShellGlyph, Slider, useFormat } from '@heliogrid/ui';
import { pictureCreditOf } from './StudioPictureChip';

/**
 * Your picture's top cards (`T-M05-002d`, board 2.1, 4.1, 4.5): one row per number — its word, then
 * − slider + and its value (ruling 5) — or one choice. × closes; nothing below repeats an act the
 * tools already offer (ruling 4).
 */

const HALF_TURN_DEG = 180;

function CardHead({
  title,
  words,
  onClose,
}: {
  title: TranslatedText;
  words: StudioCanvasWords;
  onClose: () => void;
}) {
  return (
    <div className="hg-length-box-head">
      <span className="hg-length-box-title">
        <span className="hg-size-title">{title}</span>
      </span>
      <IconButton label={words.closeCard} variant="ghost" onClick={onClose}>
        <ShellGlyph name="close" size="md" />
      </IconButton>
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  step,
  shown,
  onInput,
}: {
  label: TranslatedText;
  value: number;
  min: number;
  max: number;
  step: number;
  shown: (value: number) => string;
  onInput: (value: number) => void;
}) {
  const t = useTranslate();
  return (
    <div className="hg-size-row">
      <span className="hg-length-box-label">{label}</span>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        label={label}
        labelSpokenOnly
        format={shown}
        words={sliderWords(t)}
        onInput={onInput}
      />
      <span className="hg-length-box-value">{shown(value)}</span>
    </div>
  );
}

/** The picture's credit as a card's last line, on a phone (ruling 8). */
function CardCredit({ credit }: { credit: string | null }) {
  return credit === null ? null : <p className="hg-studio-card-credit">{credit}</p>;
}

/** The North card: a photo or a placeless map turned so north is up, in 5° steps. */
export function StudioNorthCard({
  turnDeg,
  studio,
  words,
  credit,
}: {
  turnDeg: number;
  studio: StudioScreen;
  words: StudioCanvasWords;
  credit: string | null;
}) {
  const format = useFormat();
  const { ownMoves } = studio;
  return (
    <section className="hg-studio-glass hg-length-box hg-size-card" aria-label={words.northTitle}>
      <CardHead title={words.northTitle} words={words} onClose={ownMoves.closeNorth} />
      <NumberRow
        label={words.turn}
        value={turnDeg}
        min={-HALF_TURN_DEG}
        max={HALF_TURN_DEG}
        step={PICTURE_TURN_STEP_DEG}
        shown={(deg) => `${format.number(deg)}°`}
        onInput={ownMoves.turnPicture}
      />
      <CardCredit credit={credit} />
    </section>
  );
}

/** The plan's card while it is picked: Turn in 5° steps, and how much of it shows. */
export function StudioPlanCard({
  plan,
  studio,
  words,
  credit,
}: {
  plan: PlanShown;
  studio: StudioScreen;
  words: StudioCanvasWords;
  credit: string | null;
}) {
  const format = useFormat();
  const { ownMoves } = studio;
  return (
    <section className="hg-studio-glass hg-length-box hg-size-card" aria-label={words.planTitle}>
      <CardHead title={words.planTitle} words={words} onClose={() => ownMoves.pickPlan(false)} />
      <NumberRow
        label={words.turn}
        value={plan.laid.turnDeg}
        min={-HALF_TURN_DEG}
        max={HALF_TURN_DEG}
        step={PICTURE_TURN_STEP_DEG}
        shown={(deg) => `${format.number(deg)}°`}
        onInput={ownMoves.turnPlan}
      />
      <NumberRow
        label={words.seeThrough}
        value={plan.laid.seeThrough}
        min={PLAN_SEE_THROUGH_MIN}
        max={PLAN_SEE_THROUGH_MAX}
        step={PLAN_SEE_THROUGH_STEP}
        shown={(percent) => `${format.number(percent)}%`}
        onInput={ownMoves.seePlanThrough}
      />
      <CardCredit credit={credit} />
    </section>
  );
}

/** The unit card of a plan that named none: our guess picked; a tap re-sizes the plan at once. */
export function StudioUnitCard({
  card,
  studio,
  words,
  credit,
}: {
  card: UnitCard;
  studio: StudioScreen;
  words: StudioCanvasWords;
  credit: string | null;
}) {
  const format = useFormat();
  const { ownMoves } = studio;
  const unit = card.unit ?? 'mm';
  return (
    <section className="hg-studio-glass hg-length-box hg-size-card" aria-label={words.unitTitle}>
      <CardHead title={words.unitTitle} words={words} onClose={ownMoves.closeUnit} />
      <SegmentedControl
        ariaLabel={words.unitTitle}
        value={unit}
        options={card.units.map((each) => ({ value: each, label: words.unitLabel(each) }))}
        onChange={(next) => {
          const picked = card.units.find((each) => each === next);
          if (picked !== undefined) ownMoves.pickUnit(picked);
        }}
      />
      <p className="hg-length-box-hint">
        {words.unitLine(
          unit,
          format.roofLength(card.longSideM, studio.units, false),
          format.roofLength(card.shortSideM, studio.units, false),
        )}
      </p>
      <CardCredit credit={credit} />
    </section>
  );
}

/** The one of Your picture's cards open now: the unit card first, then the plan's, then North. */
function OpenCard({
  studio,
  words,
  credit,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  credit: string | null;
}) {
  const { north, plan, unitCard } = studio.own;
  const shared = { studio, words, credit };
  if (unitCard !== null) return <StudioUnitCard card={unitCard} {...shared} />;
  if (plan?.picked) return <StudioPlanCard plan={plan} {...shared} />;
  if (north !== null) return <StudioNorthCard turnDeg={north.turnDeg} {...shared} />;
  return null;
}

/**
 * Your picture's card. On a phone it takes the credit pill's place, so the credit is its last line
 * (ruling 8): the credit line never hides.
 */
export function StudioPictureCards({
  studio,
  words,
  phone,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  phone: boolean;
}) {
  if (!studio.own.cardOpen) return null;
  const credit = phone ? pictureCreditOf(studio.picture, words) : null;
  return (
    <div className="hg-studio-picture-card">
      <OpenCard studio={studio} words={words} credit={credit} />
    </div>
  );
}
