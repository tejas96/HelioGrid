import type { CSSProperties, ReactNode } from 'react';
import { isValidElement, useContext, useEffect, useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { PrintScopeContext } from '../../utils/print-scope';
import { DISCLOSURE_ORDER, DISCLOSURE_TEXT, ruledLine } from './Disclosure.lines';
import type {
  DisclosureInput,
  DisclosureKind,
  DisclosureProps,
  DisclosureSetProps,
  DisclosureSpec,
} from './Disclosure.types';

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

  const ruled = ruledLine(kind);
  if (ruled && text !== undefined) {
    console.warn(
      `Disclosure: \`text\` is ignored for kind="${kind}". The line is verbatim and owned by the component (M06-04 / SCR-M06-17). Put your particulars in \`detail\`, or use kind="custom" for a market pack's own required line.`,
    );
  }
  const line = ruled ? ruled.line : text;
  const lead = ruled ? ruled.lead : null;

  if (line === undefined) {
    console.warn('Disclosure: kind="custom" needs `text`. Nothing rendered.');
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

function toSpec(item: DisclosureKind | DisclosureSpec): DisclosureSpec {
  return typeof item === 'string' ? { kind: item } : item;
}

function specKey(spec: DisclosureSpec): string {
  return `${spec.kind}|${spec.text ?? ''}|${spec.detail ?? ''}`;
}

/** Every true line, always, in document order. No `mode`, no `max`, no way to hide a member. */
export function DisclosureSet({
  items = [],
  surface = 'screen',
  gap,
  className,
  style,
}: WebDisclosureSetProps) {
  const seen = new Set<DisclosureKind>();
  const resolved = items
    .filter((item): item is DisclosureKind | DisclosureSpec => Boolean(item))
    .map(toSpec)
    .filter((spec) => {
      if (spec.kind === 'custom' || !seen.has(spec.kind)) {
        seen.add(spec.kind);
        return true;
      }
      return false;
    })
    .sort((a, b) => DISCLOSURE_ORDER.indexOf(a.kind) - DISCLOSURE_ORDER.indexOf(b.kind));
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
        <Disclosure key={specKey(spec)} surface={surface} {...spec} />
      ))}
    </div>
  );
}

function isDisclosureSpec(value: object): value is DisclosureSpec {
  return 'kind' in value;
}

function asKind(value: string): DisclosureKind | undefined {
  return DISCLOSURE_ORDER.find((kind) => kind === value);
}

/** What every `disclosure` / `disclaimer` host prop runs through: a kind, a spec, or a node. */
export function renderDisclosure(
  spec: DisclosureInput,
  extra: Partial<DisclosureProps> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    const kind = asKind(spec);
    if (kind === undefined) {
      console.warn(`Disclosure: "${spec}" is not a disclosure kind. Nothing rendered.`);
      return null;
    }
    return <Disclosure kind={kind} {...extra} />;
  }
  if (typeof spec !== 'object' || !isDisclosureSpec(spec)) {
    return null;
  }
  return <Disclosure {...spec} {...extra} />;
}

Disclosure.Set = DisclosureSet;
Disclosure.render = renderDisclosure;
Disclosure.TEXT = DISCLOSURE_TEXT;
