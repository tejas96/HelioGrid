import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { ValueSource } from '../ValueSource/ValueSource';
import type {
  ProposalTemplateSettingsProps,
  ProposalTemplateSettingsWords,
  TemplateLanguageStrip,
  TemplateOrigin,
  TemplatePartName,
} from './ProposalTemplateSettings.types';

export type PartProps = ProposalTemplateSettingsProps & { wide: boolean };

/**
 * Whose the part is, at its head: HelioGrid's draws its `ValueSource` line with *Write our own*
 * (D2 A); the tenant's own draws the language strip where it has one.
 */
export function PartSource({
  words,
  part,
  origin,
  strip,
  onWriteOwn,
}: {
  words: ProposalTemplateSettingsWords;
  part: TemplatePartName;
  origin: TemplateOrigin;
  strip?: TemplateLanguageStrip;
  onWriteOwn: (part: TemplatePartName) => void;
}) {
  if (origin === 'platform') {
    const line = words.platform[part];
    return (
      <ValueSource
        level="inherited"
        layerName={line.layer}
        source={line.source}
        fieldName={line.field}
        overrideLabel={words.writeOwn}
        onOverride={() => onWriteOwn(part)}
        size={12}
      />
    );
  }
  if (strip === undefined) return null;
  return (
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
  );
}
