import { numberOnTeam } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Explainer } from '../Explainer/Explainer.native';
import { Input } from '../Input/Input.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { PhoneField } from '../PhoneField/PhoneField.native';
import type { InviteFormProps } from './InviteForm.types';

/**
 * Invite Teammate's form on the phone: one column at every width — the web's `wide` layout is the
 * 1536 task pane, which a phone never has, so `layout` is not read here.
 */
export function InviteForm({
  bind,
  words,
  roles,
  heading = 'section',
  refusal = null,
  refusalAction,
  phoneRef,
}: InviteFormProps) {
  const quiet = heading === 'quiet';
  const said = refusal === null ? null : words.refusal(refusal);
  if (refusal === 'cap' && said !== null) {
    return (
      <Banner kind="cap" title={said.title} action={refusalAction}>
        {said.body ?? undefined}
      </Banner>
    );
  }
  const onTeam = numberOnTeam(refusal);
  return (
    <View style={[styles.form, quiet ? styles.formQuiet : null]}>
      {bind('inviteeName', (field) => (
        <Input
          label={words.name}
          placeholder={words.namePlaceholder}
          value={field.value}
          onChange={field.onChange}
          error={field.error}
        />
      ))}
      <View style={styles.number}>
        {bind('phoneE164', (field) => (
          <PhoneField
            ref={phoneRef}
            label={words.phone}
            helper={onTeam ? undefined : words.phoneHelper}
            value={field.value}
            onChange={field.onChange}
            error={field.error ?? (refusal === 'not_covered' ? said?.title : undefined)}
          />
        ))}
        {onTeam && said !== null ? (
          <Banner kind="state" tone="info" title={said.title} action={refusalAction}>
            {said.body ?? undefined}
          </Banner>
        ) : null}
      </View>
      {onTeam ? null : (
        <>
          <View style={styles.ask}>
            <View accessibilityRole={quiet ? undefined : 'header'}>
              <Text variant={quiet ? 'body' : 'h3'} bold={quiet}>
                {words.rolesHeading}
              </Text>
            </View>
            <Explainer {...words.rolesAsk} />
          </View>
          {bind('roles', (field) => (
            <View style={[styles.form, quiet ? styles.formQuiet : null]}>
              {field.error === undefined ? null : (
                <Banner kind="validation" tone="danger">
                  {words.noRole}
                </Banner>
              )}
              <OptionCardGroup
                mode="multiple"
                ariaLabel={words.rolesGroup}
                density="functional"
                options={roles.map((role) => ({ ...role }))}
                value={field.value}
                onChange={(picked) =>
                  field.onChange(
                    roles.filter((role) => picked.includes(role.value)).map((role) => role.value),
                  )
                }
              />
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-5'] },
  formQuiet: { gap: theme.spacing['sp-4'] },
  ask: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  number: { gap: theme.spacing['sp-3'] },
});
