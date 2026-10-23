import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file (see DoorFrame.native.tsx). */
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { RoleCard } from '../RoleCard/RoleCard.native';
import type { RoleExplainerProps } from './RoleExplainer.types';

/**
 * The role card at first run on the phone (`SCR-M01-10` m-first-run): the door held still at the
 * screen's height, the heading, then the card — whose rows scroll under its head — and the act
 * right under it. The act follows the card in every state.
 */
export function RoleExplainer({ words, surface, names, onRetry, onAct }: RoleExplainerProps) {
  const pending = names === 'pending';
  return (
    <DoorFrame
      column="near"
      bounded
      identity={
        pending ? undefined : (
          <View accessibilityRole="header">
            <Text variant="h2">{words.title}</Text>
          </View>
        )
      }
    >
      <View style={styles.task}>
        <RoleCard
          words={pending ? { ...words, credit: null } : words}
          layout="bounded"
          surface={pending ? 'loading' : surface}
          onRetry={onRetry}
        />
        <View style={styles.act}>
          <Button variant="primary" size="lg" fullWidth onClick={onAct}>
            {words.act}
          </Button>
          <Text variant="caption" color="secondary" align="center">
            {words.atAct}
          </Text>
        </View>
      </View>
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /* `sp-4` from the heading to the card and from the card to the act (m-first-run). */
  task: { flex: 1, minHeight: 0, gap: theme.spacing['sp-4'], paddingTop: theme.spacing['sp-4'] },
  act: { flexShrink: 0, gap: theme.spacing['sp-3'] },
});
