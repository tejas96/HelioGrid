import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { DISCLOSURE_ORDER, DISCLOSURE_TEXT, ruledLine } from './Disclosure.lines';
import type {
  DisclosureInput,
  DisclosureKind,
  DisclosureProps,
  DisclosureSetProps,
  DisclosureSpec,
} from './Disclosure.types';

interface NativeDisclosureProps extends DisclosureProps {
  style?: StyleProp<TextStyle>;
}

interface NativeDisclosureSetProps extends DisclosureSetProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The mandatory honesty line, in the reading flow, at the weight of the figures it qualifies.
 * No dismiss, no `open`, no `onDismiss`, no `dismissible` — there is nothing to close.
 *
 * PRINT IS WEB-ONLY HERE, AND THAT IS A STATEMENT ABOUT THE PLATFORM RATHER THAN A DEFERRAL.
 * React Native renders to a screen: there is no paper, no `@media print`, no `data-print`
 * attribute and no `PrintScope` region wrapping anything on this platform, so the web half's
 * hoist into a print-only clone has no counterpart to render. This half therefore consumes
 * `PrintScopeContext` nowhere by design, and a reader should expect none. A printed sheet is
 * produced by `PagedDocument` on the web, which is where the guard lives and is wired.
 *
 * The weight law IS what carries over: the lead clause is the figure's size at 700, the sentence
 * is reading copy at 400, and nothing can suppress either.
 */
export function Disclosure({
  kind = 'indicative-basis',
  text,
  detail,
  surface = 'screen',
  style,
}: NativeDisclosureProps) {
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

  const doc = surface === 'document';
  return (
    <Text variant="body-lg" style={[styles.body, style]}>
      {lead === null ? null : (
        <Text variant={doc ? 'h3' : 'body-lg'} style={styles.lead}>
          {doc ? `${lead}\n` : `${lead} — `}
        </Text>
      )}
      {line}
      {detail === undefined ? null : (
        <Text variant="body-lg" color="secondary">
          {`\n${detail}`}
        </Text>
      )}
    </Text>
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
  style,
}: NativeDisclosureSetProps) {
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
  const spacing = gap ?? (surface === 'document' ? 10 : 12);
  return (
    <View style={[{ gap: spacing }, style]}>
      {resolved.map((spec) => (
        <Disclosure key={specKey(spec)} surface={surface} {...spec} />
      ))}
    </View>
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

const styles = StyleSheet.create({
  body: {
    maxWidth: 640,
    color: theme.colors['text-primary'],
  },
  lead: {
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
});
