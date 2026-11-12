import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { IconButton } from '../IconButton/IconButton.native';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { ProgressBar } from '../ProgressBar/ProgressBar.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { RollingNumber } from '../RollingNumber/RollingNumber.native';
import { type DashboardPartProps, percentOf, targetShareOf } from './OwnerDashboard.logic';
import type { OwnerDashboardWords } from './OwnerDashboard.types';
import { TargetEditor } from './TargetEditor.native';
import { useTargetEditing } from './target-draft';

/**
 * Won so far this month on the phone (`M13-17`), against the company's target when one is set; a
 * reader who may set it sets or edits it in place. No target and no right to set one: nothing
 * about a target at all.
 */
export function WonCard(props: DashboardPartProps) {
  const { view, words } = props;
  const format = useFormat();
  const figure = useRef<View>(null);
  const target = useTargetEditing(props.targetSaving, props.targetFailed, figure);
  const share = targetShareOf(view);
  const editable = view.canSetTarget && !target.editing;
  return (
    <Card>
      <View
        style={styles.body}
        accessibilityLabel={words.wonSoFar}
        role="region"
        collapsable={false}
      >
        <View style={styles.head}>
          <Text variant="h3">{words.wonSoFar}</Text>
          <ProvenanceTier tier="derived" />
          {editable && view.target !== null ? (
            <View style={styles.corner}>
              <IconButton label={words.editTarget} onClick={target.open}>
                <ShellGlyph name="pencil" size="sm" tone="primary" />
              </IconButton>
            </View>
          ) : null}
        </View>
        <View ref={figure} accessible style={styles.figure}>
          <RollingNumber value={format.compactMoney(view.won.thisMonth.amount)} variant="figure" />
          <Text variant="body-sm" color="secondary">
            {words.wonDeals(view.won.thisMonth.count)}
          </Text>
        </View>
        {target.editing ? (
          <TargetEditor
            words={words}
            initial={view.target?.amount ?? null}
            saving={props.targetSaving}
            failed={props.targetFailed}
            onSave={props.onSetTarget}
            onCancel={target.close}
            focusAfter={figure}
          />
        ) : view.target !== null && share !== null ? (
          <View style={styles.target}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <ProgressBar value={share * 100} />
            </View>
            <Text variant="body-sm" color="secondary">
              {words.ofTarget(
                percentOf(share, words, format),
                format.compactMoney(view.target.amount),
              )}
            </Text>
          </View>
        ) : editable ? (
          <View style={styles.set}>
            <Button variant="ghost" size="md" onClick={target.open}>
              {words.setTarget}
            </Button>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/**
 * The forecast's honest gap (`M13-14`): no number until proposals price the pipeline — a dashed
 * outline on the page, not a tile.
 */
export function ForecastTile({ words }: { words: OwnerDashboardWords }) {
  return (
    <View
      style={styles.forecast}
      accessibilityLabel={words.forecastTitle}
      role="region"
      collapsable={false}
    >
      <Text variant="overline" color="secondary">
        {words.forecastTitle}
      </Text>
      <NamedGap gap={words.forecastGap} scale="headline" />
      <Text variant="caption" color="secondary">
        {words.forecastNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  corner: { marginStart: 'auto', marginVertical: -theme.spacing['sp-2'] },
  figure: { gap: theme.spacing['sp-1'] },
  target: { gap: theme.spacing['sp-2'] },
  set: { alignSelf: 'flex-start', marginStart: -theme.spacing['sp-3'] },
  forecast: {
    flex: 1,
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-4'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors['line-strong'],
    borderRadius: theme.radius['r-tile'],
  },
});
