import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { categoryHueOf } from '../Avatar/Avatar.logic';
import { HueTile } from '../HueTile';
import { type PartKindView, partKindViews } from './ProposalBlocks.facts';
import { brandLetter, riseOrder } from './ProposalBlocks.logic';
import type { ProposalPartsWords } from './ProposalBlocks.parts.types';
import type { ProposalPartsBlockProps } from './ProposalBlocks.types';

type TileVars = CSSProperties & Record<`--${string}`, number>;

function Brands({ kind, words }: { kind: PartKindView; words: ProposalPartsWords }) {
  return (
    <span className="hg-pb-part-brands">
      {kind.brands.map((brand, index) => (
        <span key={brand} className="hg-pb-part-brand">
          {index > 0 ? <em className="hg-pb-part-or">{words.or}</em> : null}
          <span className="hg-pb-mark hg-hue" data-hue={categoryHueOf(brand)} aria-hidden="true">
            {brandLetter(brand)}
          </span>
          {brand}
        </span>
      ))}
    </span>
  );
}

function KindWords({
  kind,
  words,
  empty,
}: {
  kind: PartKindView;
  words: ProposalPartsWords;
  /** The line an empty kind reads; absent for a kind that has its brands. */
  empty?: ReactNode;
}) {
  return (
    <div className="hg-pb-part-words">
      <span className="hg-pb-part-kind">
        {kind.name}
        {kind.count === null ? null : <span className="hg-pb-part-count">{kind.count}</span>}
      </span>
      {empty === undefined ? (
        <>
          <Brands kind={kind} words={words} />
          {kind.detail === null ? null : <span className="hg-pb-part-spec">{kind.detail}</span>}
          {kind.description === null ? null : (
            <span className="hg-pb-part-spec">{kind.description}</span>
          )}
        </>
      ) : (
        <span className="hg-pb-part-none">{empty}</span>
      )}
    </div>
  );
}

function Flag({ flag }: { flag: string }) {
  return (
    <span className="hg-pb-flag">
      <ShellGlyph name="shield-check" size="sm" tone="success" />
      {flag}
    </span>
  );
}

/** What a tile ends with: the certification its brands hold, else what a press does. */
function TileEnd({ kind, empty }: { kind: PartKindView; empty: boolean }) {
  if (empty) {
    return (
      <span className="hg-pb-part-add">
        <ShellGlyph name="plus" size="sm" tone="inverse" />
      </span>
    );
  }
  if (kind.flag !== null) return <Flag flag={kind.flag} />;
  return (
    <span className="hg-pb-part-go">
      <ShellGlyph name="chevron-right" size="sm" />
    </span>
  );
}

function AppTile({
  kind,
  words,
  onPick,
  order,
}: {
  kind: PartKindView;
  words: ProposalPartsWords;
  onPick: ProposalPartsBlockProps['onPick'];
  order: number;
}) {
  const empty = kind.brands.length === 0;
  const vars: TileVars = { '--i': riseOrder(order) };
  const inside = (
    <>
      <HueTile glyph={kind.glyph} hue={empty ? 'danger' : 'ocean'} size={40} stroke={1.6} />
      <KindWords kind={kind} words={words} empty={empty ? words.pick : undefined} />
      {onPick === undefined ? (
        kind.flag === null ? null : (
          <Flag flag={kind.flag} />
        )
      ) : (
        <TileEnd kind={kind} empty={empty} />
      )}
    </>
  );
  const className = classNames(
    'hg-pb-part hg-pb-part-tile',
    empty ? 'hg-pb-part-empty' : undefined,
  );
  if (onPick === undefined) {
    return (
      <div className={className} style={vars}>
        {inside}
      </div>
    );
  }
  return (
    <Pressable
      className={className}
      style={vars}
      onPress={() => onPick(kind.category)}
      accessibilityHint={words.pickKind(kind.name)}
    >
      {inside}
    </Pressable>
  );
}

/**
 * What goes on the roof (`M06-27`): one row per kind — its brands, read as alternatives where two
 * or three are listed, the first brand's specification and warranty, and the certification mark.
 * In the builder a kind is a tile that opens its picker, and an empty one is drawn in the danger
 * tint with its line; on paper an empty kind says it is left out; on the customer's page it is
 * simply absent — no placeholder is ever sent (`M06-17`).
 */
export function ProposalPartsBlock({
  mode,
  categories,
  components,
  words,
  onPick,
}: ProposalPartsBlockProps) {
  const kinds = partKindViews(categories, components, words);
  return (
    <div className="hg-pb hg-pb-parts" data-mode={mode}>
      <div className="hg-pb-parts-list">
        {kinds.map((kind, index) => {
          const empty = kind.brands.length === 0;
          if (mode === 'app') {
            return (
              <AppTile
                key={kind.category}
                kind={kind}
                words={words}
                onPick={onPick}
                order={index}
              />
            );
          }
          if (empty && mode === 'link') return null;
          return (
            <div
              className={classNames('hg-pb-part', empty ? 'hg-pb-part-empty' : undefined)}
              key={kind.category}
            >
              <HueTile
                glyph={kind.glyph}
                hue={empty ? 'neutral' : 'ocean'}
                size={40}
                stroke={1.6}
              />
              <KindWords kind={kind} words={words} empty={empty ? words.notPicked : undefined} />
              {empty || kind.flag === null ? null : <Flag flag={kind.flag} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
