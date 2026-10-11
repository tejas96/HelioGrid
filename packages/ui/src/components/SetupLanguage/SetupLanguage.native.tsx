import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import type { SetupLanguageProps } from './SetupLanguage.types';

/**
 * The language step in the phone's one column: the question with its ask, any finding about the
 * person, then the languages, with the way on held under the scrolling column.
 */
export function SetupLanguage({
  words,
  language,
  onChoose,
  saving,
  onContinue,
  onContinueAnyway,
}: SetupLanguageProps) {
  return (
    <DoorFrame
      trailing={null}
      column="deep"
      identity={<DoorTitle title={words.title} explainer={words.explainer} />}
      footer={
        <View style={styles.ways}>
          <Button variant="primary" size="lg" fullWidth loading={saving} onClick={onContinue}>
            {words.primary}
          </Button>
          {words.secondary === null ? null : (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              disabled={saving}
              onClick={onContinueAnyway}
            >
              {words.secondary}
            </Button>
          )}
        </View>
      }
    >
      {words.failure === null ? null : (
        <View style={styles.finding}>
          <Banner kind="validation" title={words.failure.title}>
            {words.failure.body}
          </Banner>
        </View>
      )}
      {words.notice === null ? null : (
        <View style={styles.finding}>
          <TintedBlock tone="info" title={words.notice} announce="status" />
        </View>
      )}
      <View style={styles.choices}>
        <OptionCardGroup
          label={words.group}
          options={[...words.options]}
          value={language}
          onChange={(value) => {
            const chosen = words.options.find((option) => option.value === value);
            if (chosen !== undefined) onChoose(chosen.value);
          }}
        />
      </View>
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** A finding `sp-5` under the title; the languages follow it at the same distance. */
  finding: { paddingTop: theme.spacing['sp-5'] },
  /** The languages `sp-5` under what leads them. */
  choices: { paddingTop: theme.spacing['sp-5'] },
  /** The two ways on, 12 apart (`SCR-M01-03`, `m-error`). */
  ways: { gap: theme.spacing['sp-3'] },
});
