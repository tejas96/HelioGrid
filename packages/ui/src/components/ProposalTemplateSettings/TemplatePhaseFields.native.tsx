import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input/Input.native';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher.native';
import { Textarea } from '../Textarea/Textarea.native';
import { TEMPLATE_PHASE_WHAT } from './ProposalTemplateSettings.logic';
import type { TemplatePhaseFieldsProps } from './ProposalTemplateSettings.types';

/**
 * The phase editor's body (m19-g), for the app's sheet: the language strip, *Phase name*, then
 * *What happens in this phase*, `sp-4` apart.
 */
export function TemplatePhaseFields({
  words,
  strip,
  name,
  what,
  nameError,
  whatError,
  onName,
  onWhat,
}: TemplatePhaseFieldsProps) {
  return (
    <View style={styles.fields}>
      <LanguageSwitcher
        words={words.languageSwitcher}
        languages={[...strip.languages]}
        value={strip.value}
        onChange={strip.onChange}
        label={words.language}
        labelHidden
        summary=""
        showCounts={false}
        languageNoun={words.languageNoun}
        sectionNoun={words.partsNoun}
        density="functional"
      />
      <Input
        label={words.phaseName}
        value={name}
        onChange={onName}
        error={nameError}
        density="functional"
      />
      <Textarea
        label={words.phaseWhat}
        value={what}
        onChange={onWhat}
        rows={TEMPLATE_PHASE_WHAT.rows}
        maxLength={TEMPLATE_PHASE_WHAT.maxLength}
        error={whatError}
        density="functional"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: theme.spacing['sp-4'] },
});
