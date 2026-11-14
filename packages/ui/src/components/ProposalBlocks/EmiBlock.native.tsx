import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { PAPER_TYPE } from './BlockParts.native';
import { useBlockInk } from './block-ink.native';
import type { ProposalEmiBlockProps } from './ProposalBlocks.types';
import { emiView } from './ProposalBlocks.views';
import { TrioCell } from './SavingsBlock.native';

/**
 * The EMI example (`M06-40`): the monthly payment beside the monthly saving, and the projection's
 * line — its assumptions, and that it is an example and no loan offer (`F5-42`).
 */
export function ProposalEmiBlock({ mode, emi, savings, words }: ProposalEmiBlockProps) {
  const ink = useBlockInk(mode);
  const paper = mode === 'paper';
  const view = emiView(emi, savings, useFormat());
  return (
    <View>
      <View style={styles.pair}>
        <TrioCell
          mode={mode}
          value={view.monthly.text}
          name={words.monthlyLabel(view.months)}
          tier={view.monthlyTier}
          ink={ink}
        />
        {view.monthlySaving === null ? null : (
          <TrioCell
            mode={mode}
            value={view.monthlySaving.text}
            name={words.savingLabel}
            {...(view.savingTier === null ? {} : { tier: view.savingTier })}
            ink={ink}
          />
        )}
      </View>
      <Text
        variant="body-sm"
        style={[
          styles.honest,
          { borderTopColor: ink.lineSoft, color: paper ? ink.text : ink.secondary },
          paper ? PAPER_TYPE.sub : undefined,
        ]}
      >
        {words.projection}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: theme.spacing['sp-4'] },
  honest: {
    marginTop: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 1,
  },
});
