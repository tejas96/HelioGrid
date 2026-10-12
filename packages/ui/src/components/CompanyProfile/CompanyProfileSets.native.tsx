import type { CompanyProfilePart } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Input } from '../Input/Input.native';
import { type ProfileFieldSpec, profileSet } from './CompanyProfile.logic';
import type { CompanyProfileProps } from './CompanyProfile.types';

type SetProps = Pick<CompanyProfileProps, 'words' | 'values' | 'onEdit'> & {
  part: CompanyProfilePart;
};

/**
 * One part's fields (`SCR-M01-05`). A line a reader depends on — where a value came from, what was
 * checked, what the part is for — is placed in the secondary ink, never as a field's quiet helper.
 */
export function ProfileSet({ part, words, values, onEdit }: SetProps) {
  const set = profileSet(part, words, values);
  if (set === null) return null;
  const field = (spec: ProfileFieldSpec) => (
    <Input
      key={spec.field}
      label={spec.label}
      value={spec.value}
      placeholder={spec.example}
      mono={spec.mono}
      onChange={(value) => onEdit(spec.field, value)}
    />
  );
  return (
    <View style={styles.set}>
      {set.fields.map((spec) =>
        spec.line === null ? (
          field(spec)
        ) : (
          <View key={spec.field} style={styles.pair}>
            {field(spec)}
            <Text variant="body-sm" color="secondary">
              {spec.line}
            </Text>
          </View>
        ),
      )}
      {set.purpose === null ? null : (
        <Text variant="caption" color="secondary">
          {set.purpose}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** One part's fields, `sp-4` apart. */
  set: { gap: theme.spacing['sp-4'] },
  /** A field and the line that belongs to it, `sp-2` apart. */
  pair: { gap: theme.spacing['sp-2'] },
});
