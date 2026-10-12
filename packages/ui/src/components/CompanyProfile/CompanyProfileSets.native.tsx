import type { CompanyProfilePart } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Input } from '../Input/Input.native';
import { NumberField } from '../NumberField/NumberField.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { type ProfileFieldSpec, profileSet, sizeField } from './CompanyProfile.logic';
import type { CompanyProfileProps } from './CompanyProfile.types';

type SetProps = Pick<
  CompanyProfileProps,
  'words' | 'values' | 'onEdit' | 'onChooseSegment' | 'onDeclareSize'
> & {
  part: CompanyProfilePart;
};

/**
 * One part's fields (`SCR-M01-05`). A line a reader depends on — where a value came from, what was
 * checked, what the part is for — is placed in the secondary ink, never as a field's quiet helper.
 */
export function ProfileSet({
  part,
  words,
  values,
  onEdit,
  onChooseSegment,
  onDeclareSize,
}: SetProps) {
  if (part === 'declarations') {
    return (
      <WhatYouSellSet
        words={words.declarations}
        values={values}
        onChooseSegment={onChooseSegment}
        onDeclareSize={onDeclareSize}
      />
    );
  }
  const set = profileSet(part, words, values);
  if (set === null) return null;
  const field = (spec: ProfileFieldSpec) => (
    <Input
      label={spec.label}
      value={spec.value}
      placeholder={spec.example}
      mono={spec.mono}
      error={spec.error ?? undefined}
      onChange={(value) => onEdit(spec.field, value)}
    />
  );
  return (
    <View style={set.disclosure === null ? styles.set : styles.disclosed}>
      {/* One wrapper whether or not the field has a line: a field whose line gives way to its
          error keeps its place in the tree, and so its focus, while a person types. */}
      {set.fields.map((spec) => (
        <View key={spec.field} style={styles.pair}>
          {field(spec)}
          {spec.line === null ? null : (
            <Text variant="body-sm" color="secondary">
              {spec.line}
            </Text>
          )}
        </View>
      ))}
      {set.disclosure === null ? null : (
        <Text variant="body-sm" color="secondary">
          {set.disclosure}
        </Text>
      )}
      {set.purpose === null ? null : (
        <Text variant="caption" color="secondary">
          {set.purpose}
        </Text>
      )}
    </View>
  );
}

/** The two declarations of the step before (`m-declarations-open`): the kind of business, then the typical size. */
function WhatYouSellSet({
  words,
  values,
  onChooseSegment,
  onDeclareSize,
}: Pick<SetProps, 'values' | 'onChooseSegment' | 'onDeclareSize'> & {
  words: SetProps['words']['declarations'];
}) {
  return (
    <View style={styles.sells}>
      <OptionCardGroup
        label={words.group}
        options={[...words.options]}
        value={values.segment ?? undefined}
        onChange={(value) => {
          const chosen = words.options.find((option) => option.value === value);
          if (chosen !== undefined) onChooseSegment(chosen.value);
        }}
      />
      <NumberField {...sizeField(words, values)} onCommit={onDeclareSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  /** One part's fields, `sp-4` apart. */
  set: { gap: theme.spacing['sp-4'] },
  /** A field and the disclosure of what was checked, `sp-3` apart (`m-tax-invalid`). */
  disclosed: { gap: theme.spacing['sp-3'] },
  /** A field and the line that belongs to it, `sp-2` apart. */
  pair: { gap: theme.spacing['sp-2'] },
  /** The kinds of business over the typical size, `sp-5` apart (`m-declarations-open`). */
  sells: { gap: theme.spacing['sp-5'] },
});
