import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { DerivationPart } from './Derivation.types';
import { DERIVATION_KINDS } from './Derivation.types';

const styles = StyleSheet.create({
  parts: { flexDirection: 'column', gap: 10 },
  part: { flexDirection: 'column', gap: 3 },
});

/* The DS body line-height for a panel sentence — 1.55× the size, which the type scale's own
   line-heights (fixed dp) do not carry for this role. */
const LINE = 1.55;

const SIZE = {
  xs: theme.type.roles.caption.fontSize,
  sm: theme.type.roles['body-sm'].fontSize,
  md: theme.type.roles.body.fontSize,
} as const;

/** The parts of one explanation: each kind's heading in the overline role, then its sentences. */
export function DerivationParts({
  parts,
  size = 'sm',
}: {
  parts: DerivationPart[];
  /** `sm` = the cell panel, `md` = a block, `xs` = the compact register. */
  size?: keyof typeof SIZE;
}) {
  return (
    <View style={styles.parts}>
      {parts.map((part, position) => (
        <View
          key={`${part.kind}-${typeof part.text === 'string' ? part.text : position}`}
          style={styles.part}
        >
          {/* The overline role — the one sanctioned appearance below the 12px floor. */}
          <Text variant="overline" color="tertiary">
            {part.label ?? DERIVATION_KINDS[part.kind].label}
          </Text>
          <Text
            variant={size === 'md' ? 'body' : size === 'sm' ? 'body-sm' : 'caption'}
            color="secondary"
            style={{ lineHeight: SIZE[size] * LINE }}
          >
            {part.text}
          </Text>
        </View>
      ))}
    </View>
  );
}
