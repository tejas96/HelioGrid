import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input/Input.native';
import type { SignupFieldState, SignupFieldsProps } from './SignupCompanyStep.types';

function drawField(field: SignupFieldState) {
  return (
    <Input
      label={field.label}
      placeholder={field.placeholder}
      value={field.value}
      onChange={field.onChange}
      helper={field.helper}
      error={field.error}
    />
  );
}

export function SignupFields({ bind, underAccount = false }: SignupFieldsProps) {
  return (
    <View style={[styles.fields, underAccount ? styles.underAccount : null]}>
      {bind('companyName', drawField)}
      {bind('ownerName', drawField)}
      {bind('city', drawField)}
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
  underAccount: { paddingTop: theme.spacing['sp-6'] },
});
