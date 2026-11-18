import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { DesignCover } from '../DesignCover/DesignCover.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { startModeChoice } from './ProposalStart.logic';
import type { ProposalStartSheetProps } from './ProposalStart.types';

function Sources({ props }: { props: ProposalStartSheetProps }) {
  const { sources, words } = props;
  if (sources === null) return <LoadingBars label={words.loading} bars={['row', 'row']} />;
  if (sources.length === 0) return null;
  return (
    <>
      <View style={styles.or}>
        <View style={styles.rule} />
        <Text variant="caption" color="secondary" align="center">
          {words.or}
        </Text>
        <View style={styles.rule} />
      </View>
      <View style={[tileSurface, styles.rows]}>
        <GroundProvider ground="tile">
          {sources.map((source, index) => (
            <Pressable
              key={source.id}
              style={[styles.row, index > 0 ? styles.divided : undefined]}
              disabled={props.starting}
              onPress={() => props.onCopy(source.id)}
            >
              <ShellGlyph name="layers" size="md" />
              <View style={styles.words}>
                <Text variant="body" style={styles.title}>
                  {source.title}
                </Text>
                <Text variant="caption" color="secondary">
                  {source.line}
                </Text>
              </View>
              <ShellGlyph name="chevron-right" size="sm" />
            </Pressable>
          ))}
        </GroundProvider>
      </View>
      <Text variant="caption" color="secondary" align="center">
        {words.copyLine}
      </Text>
    </>
  );
}

/** The start of a proposal on a lead: how to build it, or which proposal to copy. */
export function ProposalStartSheet(props: ProposalStartSheetProps) {
  const { words, starting } = props;
  const choice = startModeChoice(props);
  return (
    <EditorSurface
      open={props.open}
      onClose={() => {
        if (!starting) props.onClose();
      }}
      closeLabel={words.closeLabel}
      desktop="modal"
      showClose
      dismissible={!starting}
      title={words.title}
      footer={
        <View style={styles.foot}>
          {props.failure == null ? null : (
            <Text variant="body-sm" color="danger" live>
              {props.failure}
            </Text>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={starting}
            iconRight={<ShellGlyph name="arrow-right" size="sm" tone="inverse" />}
            onClick={props.onStart}
          >
            {words.start}
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <OptionCardGroup
          {...choice.group}
          options={choice.options.map(({ glyph, preview, ...option }) => ({
            ...option,
            icon: <ShellGlyph name={glyph} size="md" />,
            ...(preview === null ? {} : { content: <DesignCover word={preview} /> }),
          }))}
        />
        <Sources props={props} />
      </View>
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  foot: { gap: theme.spacing['sp-2'] },
  rows: { borderRadius: theme.radius['r-lg'], overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: 60,
    paddingVertical: 10,
    paddingLeft: theme.spacing['sp-4'],
    paddingRight: theme.spacing['sp-3'],
  },
  divided: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  words: { flex: 1, minWidth: 0 },
  // A copy's name at medium weight, as the web's `.hg-pstart-row-title`.
  title: { fontWeight: `${theme.type.weights.medium}` },
  // *or start from* between two hairlines, as the web's `.hg-pstart-or`.
  or: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  rule: { flex: 1, height: 1, backgroundColor: colors['line-soft'] },
});
