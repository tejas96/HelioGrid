import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { ProposalPicture } from '../ProposalPicture/ProposalPicture.native';
import type { CompanyStepView } from './ProposalSteps.types';
import { StepFacts, StepHint, stepLayout } from './StepParts.native';
import { proposalTypeChoice } from './step-fields';

function CoverStrip({ view }: { view: CompanyStepView }) {
  const { covers, cover, words } = view;
  const chosen = covers.find((choice) => choice.key === cover);
  return (
    <View style={stepLayout.field}>
      <View style={stepLayout.top}>
        <Text variant="field-label" color="secondary">
          {words.cover}
        </Text>
        {chosen === undefined ? null : (
          <Text variant="caption" color="secondary">
            {chosen.name}
          </Text>
        )}
      </View>
      <View style={styles.covers} accessibilityRole="radiogroup" accessibilityLabel={words.cover}>
        {covers.map((choice) => {
          const on = choice.key === cover;
          return (
            <Pressable
              key={choice.key}
              style={[styles.cover, on ? styles.coverOn : undefined]}
              accessibilityRole="radio"
              accessibilityLabel={choice.name}
              accessibilityState={{ checked: on }}
              onPress={() => view.onCover(choice.key)}
            >
              <View style={styles.coverIn}>
                <ProposalPicture name={choice.picture} src={choice.src} />
              </View>
              {on ? (
                <View style={styles.check}>
                  <ShellGlyph name="check" size="sm" tone="inverse" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Step 1 (`M06-06`, `M06-07`, `T-M06-003`): who owns the system, the cover picture for this
 * proposal, and the company's facts — read-only here, with one line naming who can change them.
 */
export function CompanyStep({ view, wide }: { view: CompanyStepView; wide: boolean }) {
  const { words, peek } = view;
  const choice = proposalTypeChoice(view);
  return (
    <>
      {wide || peek === undefined || peek.page === null ? null : (
        <Pressable style={styles.peek} accessibilityLabel={words.openPeek} onPress={peek.onOpen}>
          {peek.page}
          <View style={styles.peekTag}>
            <ShellGlyph name="eye" size="sm" />
            <Text variant="caption" bold>
              {words.peek}
            </Text>
          </View>
        </Pressable>
      )}
      <View style={stepLayout.column}>
        <OptionCardGroup
          {...choice.group}
          options={choice.options.map(({ glyph, ...option }) => ({
            ...option,
            icon: <ShellGlyph name={glyph} size="md" />,
          }))}
        />
        <CoverStrip view={view} />
        <StepFacts facts={view.facts} />
        <StepHint glyph="lock">{words.factsLine}</StepHint>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  peek: {
    height: 236,
    paddingTop: theme.spacing['sp-3'],
    alignItems: 'center',
    /* The page shows from its top — the company and the number — as the design peeks it;
       `Pressable` centres what it holds. */
    justifyContent: 'flex-start',
    overflow: 'hidden',
    borderRadius: theme.radius['r-lg'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    backgroundColor: colors['canvas-sunken'],
  },
  peekTag: {
    position: 'absolute',
    bottom: theme.spacing['sp-3'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: a tag lying over the picture it names — the card colour, as a tile is
    backgroundColor: colors.surface,
  },
  covers: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  cover: {
    flex: 1,
    aspectRatio: 4 / 3,
    padding: 2,
    borderRadius: theme.radius['r-sm'],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coverOn: { borderColor: colors.accent },
  coverIn: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: theme.radius['r-xs'],
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.accent,
  },
});
