/* Provenance — the persistent, legible content that sits beside a number and says how much to
   trust it. F8-01 puts a tier on every user-visible number; F8-07 says exactly how it may appear:

     "…renders as persistent, legible content beside the number it qualifies — not as a tooltip,
      not as a hover state, not as a colour difference alone, not as a footnote."

   THE WORD IS THE DEFAULT EVERYWHERE. The dot survives only as the second, non-colour channel
   N6 asks for: it never carries the meaning alone, and removing it would lose nothing but a cue.

   Renders `standing · freshness · tier · energy source · source · projection · note` in that
   order — standing and freshness lead, because "this is not final" outranks "this is how it was
   worked out". */

import type { CSSProperties, ReactNode } from 'react';
import { Fragment } from 'react';
import { classNames } from '../../primitives/class-names';
import {
  FRESHNESS_MARK,
  freshnessWarning,
  isProvenanceEmpty,
  provenanceStep,
  STANDING_MARK,
  TIER_MARK,
  tierOf,
} from './Provenance.tiers';
import type {
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceTierProps,
  ProvenanceTierSpec,
} from './Provenance.types';
import { useProvenanceWords } from './Provenance.words';

interface WebProvenanceProps extends ProvenanceProps {
  className?: string;
  style?: CSSProperties;
}

interface WebProvenanceTierProps extends ProvenanceTierProps {
  className?: string;
  style?: CSSProperties;
}

/** Second channel only (N6). The word beside it already carries the meaning. */
function Dot({ token }: { token: ProvenanceMarkToken }) {
  return <span aria-hidden="true" className="hg-provenance-dot" data-token={token} />;
}

/** The tier on its own — word first, dot as the second channel. */
export function ProvenanceTier({ tier, size = 12, className, style }: WebProvenanceTierProps) {
  const words = useProvenanceWords();
  const t = tierOf(tier);
  if (!t) {
    return null;
  }
  return (
    <span
      className={classNames('hg-provenance-tier', className)}
      data-size={provenanceStep(size)}
      style={style}
    >
      <Dot token={TIER_MARK[t]} />
      {words.tier(t)}
    </span>
  );
}

export function Provenance({
  tier,
  standing,
  freshness,
  energySource,
  source,
  projection,
  note,
  size = 12,
  align = 'left',
  inline = false,
  className,
  style,
}: WebProvenanceProps) {
  const words = useProvenanceWords();
  const t = tierOf(tier);
  const parts: { id: string; node: ReactNode }[] = [];

  /* Standing leads: "this is not final" outranks "this is how it was worked out". */
  if (standing) {
    const st = STANDING_MARK[standing];
    parts.push({
      id: 'standing',
      node: (
        <span className="hg-provenance-standing" data-token={st.color}>
          <Dot token={st.mark} />
          {words.standing(standing)}
        </span>
      ),
    });
  }
  const warning = freshnessWarning(freshness);
  if (warning) {
    parts.push({
      id: 'freshness',
      node: (
        <span className="hg-provenance-standing" data-token={FRESHNESS_MARK.color}>
          <Dot token={FRESHNESS_MARK.mark} />
          {words.freshness(warning)}
        </span>
      ),
    });
  }
  if (t) {
    parts.push({
      id: 'tier',
      node: (
        <span className="hg-provenance-part">
          <Dot token={TIER_MARK[t]} />
          {words.tier(t)}
        </span>
      ),
    });
  }
  for (const [id, prose] of [
    ['energySource', energySource ? words.energySource(energySource) : undefined],
    ['source', source],
    ['projection', projection],
    ['note', note],
  ] as const) {
    if (prose) {
      parts.push({ id, node: <span>{prose}</span> });
    }
  }
  if (parts.length === 0) {
    return null;
  }

  return (
    <span
      className={classNames('hg-provenance', className)}
      data-inline={inline ? 'true' : undefined}
      data-align={align}
      data-size={provenanceStep(size)}
      style={style}
    >
      {parts.map((part, i) => (
        <Fragment key={part.id}>
          {i > 0 ? (
            <span aria-hidden="true" className="hg-provenance-sep">
              ·
            </span>
          ) : null}
          {part.node}
        </Fragment>
      ))}
    </span>
  );
}

/** True when a spec would render NOTHING — lets a host skip the slot without guessing. */
Provenance.isEmpty = isProvenanceEmpty;

/**
 * Accepts a spec object or a bare tier, so every host can offer ONE `provenance` prop. Never a
 * ready node: a caller's element could print a fifth tier past the closed set (`F8-03`).
 */
export function renderProvenance(
  spec?: ProvenanceProps | ProvenanceTierSpec | null,
  extra: Partial<ProvenanceProps> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  /* A bare tier goes through the same emptiness guard as a spec: `renderProvenance("unmarked")`
     must hand back null, or every host draws its slot around the deliberate absence. */
  const props: ProvenanceProps = typeof spec === 'string' ? { tier: spec } : spec;
  const merged = { ...props, ...extra };
  return isProvenanceEmpty(merged) ? null : <Provenance {...merged} />;
}
