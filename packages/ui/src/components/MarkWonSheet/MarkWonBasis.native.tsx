import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { HueTile } from '../HueTile/HueTile.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import { AfterHint } from '../ProposalAfterParts/ProposalAfterParts.native';
import type { MarkWonBasisView } from './MarkWonSheet.types';

/** The acceptance as the win's proof — or, with none to stand on, why the value is typed. */
export function MarkWonProof({ basis }: { basis: MarkWonBasisView }) {
  return (
    <View style={[styles.proof, basis.locked ? styles.proofGood : styles.proofWarn]}>
      {basis.locked ? (
        <LottieMoment name="success" size={48} />
      ) : (
        <HueTile glyph="alert-triangle" hue="warning" size={40} stroke={1.7} />
      )}
      <View style={styles.grow}>
        <Text variant="body" bold>
          {basis.proofTitle}
        </Text>
        <Text variant="body-sm" color="secondary">
          {basis.proofLine}
        </Text>
      </View>
    </View>
  );
}

/** The accepted version's payable: shown, locked, with the line that says where it came from. */
export function MarkWonLockedValue({ basis }: { basis: MarkWonBasisView }) {
  return (
    <View style={styles.value}>
      <Text variant="overline" color="secondary">
        {basis.lockedLabel}
      </Text>
      <Text variant="display" style={styles.figure}>
        {basis.lockedValue}
      </Text>
      <AfterHint glyph="lock">{basis.lockedNote}</AfterHint>
    </View>
  );
}

/** The plan the project starts with, row for row, and the call that comes before the tap. */
export function MarkWonPlan({ basis }: { basis: MarkWonBasisView }) {
  return (
    <>
      {basis.plan.length === 0 ? null : (
        <>
          <Text variant="overline" color="secondary">
            {basis.planTitle}
          </Text>
          <View style={styles.plan}>
            {basis.plan.map((part, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a plan's parts keep their order and may repeat a name
              <View key={index} style={[styles.part, index > 0 ? styles.ruled : undefined]}>
                <Text variant="display" style={styles.share}>
                  {part.share}
                </Text>
                <View style={styles.grow}>
                  <Text variant="body" bold>
                    {part.name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {part.due}
                  </Text>
                </View>
                {part.amount === null ? null : <Text variant="mono">{part.amount}</Text>}
              </View>
            ))}
          </View>
        </>
      )}
      {basis.sibling === null ? null : <AfterHint glyph="people">{basis.sibling}</AfterHint>}
      {basis.callFirst === null ? null : <AfterHint>{basis.callFirst}</AfterHint>}
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-lg'],
  },
  proofGood: { backgroundColor: colors['success-bg'] },
  proofWarn: { backgroundColor: colors['warning-bg'] },
  value: {
    gap: theme.spacing['sp-1'],
    padding: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-lg'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  figure: { fontFamily: theme.type.families.display, fontSize: 40, lineHeight: 46 },
  plan: { borderRadius: theme.radius['r-lg'], borderWidth: 1, borderColor: colors['line-soft'] },
  part: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.spacing['sp-16'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  ruled: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  share: {
    flexShrink: 0,
    minWidth: theme.spacing['sp-12'],
    fontFamily: theme.type.families.display,
    fontSize: theme.type.roles.h2.fontSize,
    lineHeight: theme.type.roles.h2.lineHeight,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
