import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import type { MergeDoneProps } from './MergeCompare.types';
import { MergeMoves } from './MergeMoves.native';

/**
 * The calm end of a merge on the phone: the one hero — a tick, "Merged.", what points where, and
 * *Open customer* in thumb reach, where the screen reader lands as the done appears — then what
 * moved.
 */
export function MergeDone({ words, onOpenCustomer, onBackToLeads }: MergeDoneProps) {
  const open = useRef<FocusHandle>(null);
  useEffect(() => {
    open.current?.focus();
  }, []);
  return (
    <>
      <HeroPanel name={words.title}>
        <View style={styles.done}>
          <View style={styles.tick}>
            <ShellGlyph name="tick" size="lg" tone="success" />
          </View>
          <Text variant="display">{words.title}</Text>
          <Text variant="body-lg">{words.line}</Text>
          <Text variant="body-sm" color="secondary">
            {words.by}
          </Text>
          <View style={styles.acts}>
            <Button
              ref={open}
              variant="primary"
              size="prominent"
              fullWidth
              icon={<ShellGlyph name="arrow-up-right" size="md" tone="inverse" />}
              onClick={onOpenCustomer}
            >
              {words.openCustomer}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              icon={<ShellGlyph name="chevron-left" size="md" />}
              onClick={onBackToLeads}
            >
              {words.backToLeads}
            </Button>
          </View>
        </View>
      </HeroPanel>
      <Card>
        <MergeMoves {...words.moved} tombstone={null} cannotUndo={null} />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  done: { alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  tick: {
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['success-bg'],
  },
  acts: { alignSelf: 'stretch', gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-2'] },
});
