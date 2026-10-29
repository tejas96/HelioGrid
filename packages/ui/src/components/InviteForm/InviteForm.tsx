import { numberOnTeam, type RolePreset } from '@heliogrid/domain';
import { useEffect, useId, useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import { Banner } from '../Banner/Banner';
import { Explainer } from '../Explainer/Explainer';
import { Input } from '../Input/Input';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { PhoneField } from '../PhoneField/PhoneField';
import type { InviteFieldState, InviteFormProps } from './InviteForm.types';

/**
 * Invite Teammate's form: the name, the phone, then *What can they do?* with its ask and the twelve
 * presets. A press with no preset raises the refusal at the top of the role list and scrolls it into
 * view (`SCR-M01-07` blocked-no-role); the act stays live. A send the api turned down draws its
 * refusal in place (`refusal`).
 */
export function InviteForm({
  bind,
  words,
  roles,
  layout = 'stacked',
  heading = 'section',
  presses = 0,
  refusal = null,
  refusalAction,
  phoneRef,
}: InviteFormProps) {
  const wide = layout === 'wide';
  const said = refusal === null ? null : words.refusal(refusal);
  if (refusal === 'cap' && said !== null) {
    return (
      <div className="hg-invite-form" data-layout={layout} data-heading={heading}>
        <Banner kind="cap" title={said.title} action={refusalAction}>
          {said.body ?? undefined}
        </Banner>
      </div>
    );
  }
  const onTeam = numberOnTeam(refusal);
  return (
    <div className="hg-invite-form" data-layout={layout} data-heading={heading}>
      <div className="hg-invite-form-who">
        {bind('inviteeName', (field) => (
          <Input
            label={words.name}
            placeholder={words.namePlaceholder}
            value={field.value}
            onChange={field.onChange}
            error={field.error}
          />
        ))}
        <div className="hg-invite-form-number">
          {bind('phoneE164', (field) => (
            <PhoneField
              ref={phoneRef}
              label={words.phone}
              words={words.phoneField}
              helper={wide || onTeam ? undefined : words.phoneHelper}
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
        </div>
      </div>
      {onTeam ? null : (
        <div className="hg-invite-form-roles">
          <div className="hg-invite-form-ask">
            {heading === 'section' ? (
              <Text as="h2" variant="h3">
                {words.rolesHeading}
              </Text>
            ) : (
              <Text variant="body" bold>
                {words.rolesHeading}
              </Text>
            )}
            <Explainer {...words.rolesAsk} />
          </div>
          {bind('roles', (field) => (
            <InviteRoles
              field={field}
              words={words}
              roles={roles}
              columns={wide ? 3 : 1}
              presses={presses}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InviteRoles({
  field,
  words,
  roles,
  columns,
  presses,
}: {
  field: InviteFieldState<RolePreset[]>;
  words: InviteFormProps['words'];
  roles: InviteFormProps['roles'];
  columns: number;
  presses: number;
}) {
  const refusal = useRef<HTMLDivElement>(null);
  const refusalId = useId();
  const refused = field.error !== undefined;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a press is what brings the refusal into view again, even with nothing else changed.
  useEffect(() => {
    if (refused) refusal.current?.scrollIntoView({ block: 'nearest' });
  }, [refused, presses]);
  return (
    <>
      {refused ? (
        <div ref={refusal} id={refusalId}>
          <Banner kind="validation" tone="danger">
            {words.noRole}
          </Banner>
        </div>
      ) : null}
      <OptionCardGroup
        mode="multiple"
        ariaLabel={words.rolesGroup}
        invalid={refused}
        describedBy={refused ? refusalId : undefined}
        density="functional"
        columns={columns}
        options={roles.map((role) => ({ ...role }))}
        value={field.value}
        onChange={(picked) =>
          field.onChange(
            roles.filter((role) => picked.includes(role.value)).map((role) => role.value),
          )
        }
      />
    </>
  );
}
