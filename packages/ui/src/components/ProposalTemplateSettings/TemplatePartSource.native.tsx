import { ValueSource } from '../ValueSource/ValueSource.native';
import type {
  ProposalTemplateSettingsWords,
  TemplateOrigin,
  TemplatePartName,
} from './ProposalTemplateSettings.types';

/**
 * Whose the part is, at its head: HelioGrid's draws its `ValueSource` line with *Write our own*
 * (D2 A); the tenant's own needs no line.
 */
export function PartSource({
  words,
  part,
  origin,
  onWriteOwn,
}: {
  words: ProposalTemplateSettingsWords;
  part: TemplatePartName;
  origin: TemplateOrigin;
  onWriteOwn: (part: TemplatePartName) => void;
}) {
  if (origin === 'own') return null;
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
