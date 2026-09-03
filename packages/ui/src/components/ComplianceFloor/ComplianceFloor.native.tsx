import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { ComplianceFloorSpec } from './ComplianceFloor.types';
import { complianceFloorWords } from './ComplianceFloor.words';

interface NativeComplianceFloorProps extends ComplianceFloorSpec {
  style?: StyleProp<ViewStyle>;
}

/* A statute, not a padlock: the owner is not shut out of this row, they may edit and move it. */
function ShieldGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 3.2 5 6.1v5.6c0 4.1 2.8 7.3 7 9 4.2-1.7 7-4.9 7-9V6.1l-7-2.9Z" />
      <Path d="M9.2 12.2l2 2 3.6-3.9" />
    </Svg>
  );
}

/** A floor named on the row it protects, or the save it refused. */
export function ComplianceFloor(props: NativeComplianceFloorProps) {
  const { action, variant = 'line', size = 12, message, style } = props;
  const { head, named, body } = complianceFloorWords(props);
  const step = Math.max(12, size);

  if (variant === 'refusal') {
    return (
      <View accessibilityRole="alert" style={[styles.refusal, style]}>
        <View style={styles.refusalGlyph}>
          <ShieldGlyph size={18} color={theme.colors['warning-text']} />
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
        <ShieldGlyph size={step + 1} color={theme.colors['text-tertiary']} />
      </View>
      <Text variant={step >= 13 ? 'body-sm' : 'caption'} color="secondary" style={styles.lineWords}>
        <Text
          variant={step >= 13 ? 'body-sm' : 'caption'}
          color="secondary"
          style={styles.lineHead}
        >
          {head}
        </Text>
        {named === '' ? null : (
          <Text variant={step >= 13 ? 'body-sm' : 'caption'} color="secondary">
            {` · ${named}`}
          </Text>
        )}
        {message === undefined ? null : (
          <Text variant={step >= 13 ? 'body-sm' : 'caption'} color="secondary">
            {` ${message}`}
          </Text>
        )}
      </Text>
    </View>
  );
}

function isFloorSpec(value: object): value is ComplianceFloorSpec {
  return !(Symbol.iterator in value);
}

/** What every `lock` / `floor` host prop runs through: a spec object, or a ready node. */
export function renderComplianceFloor(
  spec?: ComplianceFloorSpec | ReactNode,
  extra: Partial<ComplianceFloorSpec> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec !== 'object' || !isFloorSpec(spec)) {
    return null;
  }
  return <ComplianceFloor {...spec} {...extra} />;
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
    backgroundColor: theme.colors['warning-bg'],
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
    color: theme.colors['warning-text'],
  },
});
