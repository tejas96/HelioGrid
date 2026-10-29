import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import {
  disclosureFor,
  disclosureKey,
  hasDisclosureLine,
  orderedDisclosures,
} from './Disclosure.logic';
import type { DisclosureInput, DisclosureProps, DisclosureSetProps } from './Disclosure.types';
import { useDisclosureText } from './Disclosure.words';

/** The particulars start their own line inside the one paragraph, so the line and they read as one. */
const LINE_BREAK = '\n';

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
  const { lead, line } = useDisclosureText(kind, text);

  if (!hasDisclosureLine(line)) {
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
          {LINE_BREAK}
          {detail}
        </Text>
      )}
    </Text>
  );
}

/** Every true line, always, in document order. No `mode`, no `max`, no way to hide a member. */
export function DisclosureSet({
  items = [],
  surface = 'screen',
  gap,
  style,
}: NativeDisclosureSetProps) {
  const resolved = orderedDisclosures(items);
  if (resolved.length === 0) {
    return null;
  }
  const spacing = gap ?? (surface === 'document' ? 10 : 12);
  return (
    <View style={[{ gap: spacing }, style]}>
      {resolved.map((spec) => (
        <Disclosure key={disclosureKey(spec)} surface={surface} {...spec} />
      ))}
    </View>
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
