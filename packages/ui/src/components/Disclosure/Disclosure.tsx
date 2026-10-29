import type { CSSProperties, ReactNode } from 'react';
import { useContext, useEffect, useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { PrintScopeContext } from '../../utils/print-scope';
import {
  disclosureFor,
  disclosureKey,
  hasDisclosureLine,
  orderedDisclosures,
} from './Disclosure.logic';
import type { DisclosureInput, DisclosureProps, DisclosureSetProps } from './Disclosure.types';
import { useDisclosureText } from './Disclosure.words';

/* The .d.ts types `as` as `keyof JSX.IntrinsicElements`; the whole intrinsic union is not
   representable as one props type, so this is the block-level subset a document paragraph can
   legitimately be — the same narrowing the Text primitive makes. */
type DisclosureElement = 'p' | 'div' | 'section' | 'article' | 'li' | 'span';

interface WebDisclosureProps extends DisclosureProps {
  /** The element. A disclosure is a paragraph of the document, so `p` unless `detail` needs a block. */
  as?: DisclosureElement;
  className?: string;
  style?: CSSProperties;
}

interface WebDisclosureSetProps extends DisclosureSetProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The mandatory honesty line, in the reading flow, at the weight of the figures it qualifies.
 * No dismiss, no `open`, no `onDismiss`, no `dismissible` — there is nothing to close.
 *
 * AND IT PRINTS, IN BOTH DIRECTIONS. `data-print="always"` is the declaration (tokens/print.css);
 * the guard for the case CSS cannot reach — a disclosure inside a print-SUPPRESSED region — is the
 * `PrintScope` registry below. `display:block !important` never beats an ancestor's `display:none`,
 * so the declaration alone would have made a P0 mandatory statement suppressible by placement.
 */
export function Disclosure({
  kind = 'indicative-basis',
  text,
  detail,
  surface = 'screen',
  as,
  className,
  style,
}: WebDisclosureProps) {
  const scope = useContext(PrintScopeContext);
  const id = useId();
  const suppressed = scope?.suppressed === true;

  /* THE GUARD, not an assertion: inside a print-suppressed region this registers itself so the
     scope can print it beside the block that will not print. `spec` is data, never a node — the
     scope re-renders the disclosure, which is what keeps the verbatim wording in one place. */
  useEffect(() => {
    if (scope === null || !suppressed) {
      return undefined;
    }
    scope.register(id, { kind, text, detail, surface });
    console.warn(
      `Disclosure (kind="${kind}") is inside a print-suppressed region. It is not suppressible — it has been hoisted into a print-only copy so it still prints. Move it out of the screen-only block.`,
    );
    return () => scope.unregister(id);
  }, [scope, suppressed, id, kind, text, detail, surface]);

  const { lead, line } = useDisclosureText(kind, text);

  if (!hasDisclosureLine(line)) {
    return null;
  }

  const Tag: DisclosureElement = as ?? (detail === undefined ? 'p' : 'div');
  return (
    <Tag
      data-print="always"
      data-keep-together=""
      data-surface={surface}
      role="note"
      className={classNames('hg-disclosure', className)}
      style={style}
    >
      {lead === null ? null : (
        <strong className="hg-disclosure-lead">
          {surface === 'document' ? lead : `${lead} — `}
        </strong>
      )}
      {line}
      {detail === undefined ? null : <span className="hg-disclosure-detail">{detail}</span>}
    </Tag>
  );
}

/** Every true line, always, in document order. No `mode`, no `max`, no way to hide a member. */
export function DisclosureSet({
  items = [],
  surface = 'screen',
  gap,
  className,
  style,
}: WebDisclosureSetProps) {
  const resolved = orderedDisclosures(items);
  if (resolved.length === 0) {
    return null;
  }
  return (
    <div
      className={classNames('hg-disclosure-set', className)}
      data-surface={surface}
      style={gap === undefined ? style : { gap: `${gap}px`, ...style }}
    >
      {resolved.map((spec) => (
        <Disclosure key={disclosureKey(spec)} surface={surface} {...spec} />
      ))}
    </div>
  );
}

/** What every `disclosure` / `disclaimer` host prop runs through: a kind, a spec, or a node. */
export function renderDisclosure(
  spec: DisclosureInput,
  extra: Partial<DisclosureProps> = {},
): ReactNode {
  return disclosureFor(spec, (plain) => <Disclosure {...plain} {...extra} />);
}

Disclosure.Set = DisclosureSet;
Disclosure.render = renderDisclosure;
