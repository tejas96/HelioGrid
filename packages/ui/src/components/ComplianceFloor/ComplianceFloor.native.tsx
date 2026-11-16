import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { noteLineScale } from '../ActionReason/ActionReason.logic';
import type { ShellGlyphSize } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { complianceFloorFor } from './ComplianceFloor.logic';
import type { ComplianceFloorSpec } from './ComplianceFloor.types';
import { complianceFloorSentences } from './ComplianceFloor.words';

interface NativeComplianceFloorProps extends ComplianceFloorSpec {
  style?: StyleProp<ViewStyle>;
}

/* A statute, not a padlock: the owner is not shut out of this row, they may edit and move it. */
function ShieldGlyph({ size, color }: { size: ShellGlyphSize; color: ThemeColor }) {
  return <ShellGlyph name="shield-check" size={size} ink={color} />;
}

/** A floor named on the row it protects, or the save it refused. */
export function ComplianceFloor(props: NativeComplianceFloorProps) {
  const { action, variant = 'line', size = 12, message, style } = props;
  const { head, named, body } = complianceFloorSentences(props);
  const scale = noteLineScale(size);

  if (variant === 'refusal') {
    return (
      <View accessibilityRole="alert" style={[styles.refusal, style]}>
        <View style={styles.refusalGlyph}>
          <ShieldGlyph size="sm" color={TONE.warning.ink} />
        </View>
        <View style={styles.refusalBody}>
          <Text variant="body-sm" style={styles.refusalHead}>
            {head}
          </Text>
          {body === null ? null : (
            <Text variant="body-sm" color="secondary">
              {body}
            </Text>
          )}
          {action}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.line, style]}>
      <View style={styles.lineGlyph}>
        <ShieldGlyph size={scale.glyphSize} color={colors['text-tertiary']} />
      </View>
      <Text
        variant={scale.large ? 'body-sm' : 'caption'}
        color="secondary"
        style={styles.lineWords}
      >
        <Text
          variant={scale.large ? 'body-sm' : 'caption'}
          color="secondary"
          style={styles.lineHead}
        >
          {head}
        </Text>
        {named === '' ? null : (
          <Text variant={scale.large ? 'body-sm' : 'caption'} color="secondary">
            {` · ${named}`}
          </Text>
        )}
        {message === undefined ? null : (
          <Text variant={scale.large ? 'body-sm' : 'caption'} color="secondary">
            {` ${message}`}
          </Text>
        )}
      </Text>
    </View>
  );
}

export function renderComplianceFloor(
  spec?: ComplianceFloorSpec | ReactNode,
  extra: Partial<ComplianceFloorSpec> = {},
): ReactNode {
  return complianceFloorFor(spec, (plain) => <ComplianceFloor {...plain} {...extra} />);
}

ComplianceFloor.render = renderComplianceFloor;

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: theme.spacing['sp-0-5'],
  },
  lineGlyph: {
    flexShrink: 0,
    marginTop: 1,
  },
  lineWords: {
    flexShrink: 1,
  },
  lineHead: {
    fontWeight: '500',
  },
  refusal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: theme.radius['r-sm'],
    backgroundColor: TONE.warning.tint,
  },
  refusalGlyph: {
    flexShrink: 0,
    marginTop: 1,
  },
  refusalBody: {
    flexShrink: 1,
    gap: 6,
  },
  refusalHead: {
    fontWeight: '700',
    color: TONE.warning.ink,
  },
});
