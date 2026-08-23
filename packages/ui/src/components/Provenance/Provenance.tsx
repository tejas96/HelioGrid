/* Provenance — the persistent, legible content that sits beside a number and says how much to
   trust it. F8-01 puts a tier on every user-visible number; F8-07 says exactly how it may appear:

     "…renders as persistent, legible content beside the number it qualifies — not as a tooltip,
      not as a hover state, not as a colour difference alone, not as a footnote."

   THE WORD IS THE DEFAULT EVERYWHERE. The dot survives only as the second, non-colour channel
   N6 asks for: it never carries the meaning alone, and removing it would lose nothing but a cue.

   Renders `standing · tier · source · projection` in that order — standing leads, because
   "this is not final" outranks "this is how it was worked out". */

import type { CSSProperties, ReactNode } from 'react';
import { Fragment, isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import {
  isProvenanceEmpty,
  PROVENANCE_STANDINGS,
  provenanceStep,
  resolveTier,
} from './Provenance.tiers';
import type {
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceTierProps,
  ProvenanceTierSpec,
} from './Provenance.types';

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
export function ProvenanceTier({
  tier,
  withLabel = true,
  size = 12,
  className,
  style,
}: WebProvenanceTierProps) {
  const t = resolveTier(tier);
  if (!t) {
    return null;
  }
  return (
    <span
      className={classNames('hg-provenance-tier', className)}
      data-size={provenanceStep(size)}
      style={style}
    >
      <Dot token={t.color} />
      {/* NAME_FROM_CONTENT (check h): `withLabel={false}` keeps the WORD for assistive tech — the
          dot is the sighted carrier and the meaning is never colour alone (F7-12). That word is
          this node's name, and it is CONTENT here where the native half spells it as
          `accessibilityLabel`. Through the DS `Text` primitive so the name source is declared
          rather than hidden inside an unreadable clipped `<span>`. */}
      {withLabel ? (
        t.label
      ) : (
        <Text as="span" className="hg-provenance-sr">
          {t.label}
        </Text>
      )}
    </span>
  );
}

export function Provenance({
  tier,
  standing,
  source,
  projection,
  note,
  size = 12,
  align = 'left',
  inline = false,
  className,
  style,
}: WebProvenanceProps) {
  const t = resolveTier(tier);
  const st = standing ? PROVENANCE_STANDINGS[standing] : null;
  const parts: { id: string; node: ReactNode }[] = [];

  /* Standing leads: "this is not final" outranks "this is how it was worked out". */
  if (st) {
    parts.push({
      id: 'standing',
      node: (
        <span className="hg-provenance-standing" data-token={st.color}>
          <Dot token={st.mark} />
          {st.label}
        </span>
      ),
    });
  }
  if (t) {
    parts.push({
      id: 'tier',
      node: (
        <span className="hg-provenance-part">
          <Dot token={t.color} />
          {t.label}
        </span>
      ),
    });
  }
  for (const [id, words] of [
    ['source', source],
    ['projection', projection],
    ['note', note],
  ] as const) {
    if (words) {
      parts.push({ id, node: <span>{words}</span> });
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

/** Accepts either a spec object or a ready node, so every host can offer ONE `provenance` prop. */
export function renderProvenance(
  spec?: ProvenanceProps | ProvenanceTierSpec | ReactNode,
  extra: Partial<ProvenanceProps> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <Provenance tier={spec} {...extra} />;
  }
  if (typeof spec !== 'object') {
    return null;
  }
  const props = spec as ProvenanceProps;
  if (isProvenanceEmpty(props)) {
    return null;
  }
  return <Provenance {...props} {...extra} />;
}
