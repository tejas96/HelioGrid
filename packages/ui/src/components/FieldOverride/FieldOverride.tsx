import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { resetName, resetWords, takeName } from './FieldOverride.names';
import type { FieldOverrideSpec, FieldOverrideWords } from './FieldOverride.types';

interface WebFieldOverrideProps extends FieldOverrideSpec {
  className?: string;
  style?: CSSProperties;
}

/** 12 is the type floor; 13 is the only step above it this line takes. */
const sizeAttr = (size: number) => (size >= 13 ? 'sm' : 'xs');

/**
 * **The one override treatment.** An overridden value renders three things, in this order, in one
 * line under the value it qualifies: the **marker** (a word), the **superseded value** (both
 * values under `stale`, because one of them is what the user is deciding against), and the
 * **reset**, a 44px target that **names what it restores** — visibly and in its accessible name,
 * which contains the visible words (WCAG 2.5.3).
 */
export function FieldOverride({
  state = 'overridden',
  autoValue,
  autoSource,
  newValue,
  fieldName,
  onReset,
  onTake,
  autoLabel,
  words,
  size = 12,
  className,
  style,
}: WebFieldOverrideProps) {
  if (state === 'none') return null;
  const stale = state === 'stale';

  return (
    <div
      className={classNames('hg-field-override', className)}
      data-size={sizeAttr(size)}
      style={style}
    >
      <span className="hg-field-override-mark" data-state={state}>
        {/* The marker is a WORD, never a colour or a dot alone. */}
        <span className="hg-field-override-dot" aria-hidden="true" />
        {stale ? words.designMovedOn : words.edited}
      </span>

      <Superseded
        stale={stale}
        autoValue={autoValue}
        autoSource={autoSource}
        newValue={newValue}
        autoLabel={autoLabel ?? words.was}
        words={words}
      />

      <span className="hg-field-override-actions">
        {stale && onTake !== undefined ? (
          <Pressable
            className="hg-field-override-button hg-field-override-button--strong"
            onPress={onTake}
            accessibilityLabel={takeName(words, fieldName, newValue)}
          >
            {words.take}
          </Pressable>
        ) : null}
        {onReset !== undefined ? (
          /* THE ACCESSIBLE NAME NAMES WHAT THIS BUTTON RESTORES, AND CONTAINS THE VISIBLE WORDS
             (WCAG 2.5.3). Under `stale` the visible word is "Keep mine" and what it keeps is the
             USER's figure — `autoValue`, the "yours" side. The design's figure belongs to the
             button beside it. */
          <Pressable
            className="hg-field-override-button"
            onPress={onReset}
            accessibilityLabel={resetName(words, stale, fieldName, autoValue)}
          >
            {resetWords(words, stale, autoValue)}
          </Pressable>
        ) : null}
      </span>
    </div>
  );
}

/**
 * **2 · the superseded value.** Under `stale` BOTH values are named — "yours 4.2 kWp · design now
 * 5.1 kWp" — because one of them is what the user is deciding against.
 */
function Superseded({
  stale,
  autoValue,
  autoSource,
  newValue,
  autoLabel,
  words,
}: Pick<FieldOverrideSpec, 'autoValue' | 'autoSource' | 'newValue'> & {
  stale: boolean;
  autoLabel: string;
  words: FieldOverrideWords;
}) {
  const source =
    autoSource === undefined ? null : (
      <span className="hg-field-override-source">
        {' · '}
        {stale ? words.from(autoSource) : autoSource}
      </span>
    );

  if (stale) {
    return (
      <span className="hg-field-override-values">
        {words.yours} <strong className="hg-field-override-figure">{autoValue}</strong>
        {newValue === undefined || newValue === null ? null : (
          <>
            {' · '}
            {words.designNow} <strong className="hg-field-override-figure">{newValue}</strong>
          </>
        )}
        {source}
      </span>
    );
  }

  if (autoValue === undefined || autoValue === null) return null;
  return (
    <span className="hg-field-override-values">
      {autoLabel} <strong className="hg-field-override-figure">{autoValue}</strong>
      {source}
    </span>
  );
}

/** Renders a spec object, a ready node, or nothing — what every host prop runs through. */
export function renderOverride(
  spec?: FieldOverrideSpec | ReactNode,
  extra?: Partial<WebFieldOverrideProps>,
): ReactNode {
  if (spec === undefined || spec === null || spec === false) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec !== 'object') return null;
  return <FieldOverride {...(spec as FieldOverrideSpec)} {...extra} />;
}

FieldOverride.render = renderOverride;
