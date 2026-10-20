import type { RolePreset } from '@heliogrid/domain';
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
 * view (`SCR-M01-07` blocked-no-role); the act stays live.
 */
export function InviteForm({
  bind,
  words,
  roles,
  layout = 'stacked',
  heading = 'section',
  presses = 0,
}: InviteFormProps) {
  const wide = layout === 'wide';
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
        {bind('phoneE164', (field) => (
          <PhoneField
            label={words.phone}
            helper={wide ? undefined : words.phoneHelper}
            value={field.value}
            onChange={field.onChange}
            error={field.error}
          />
        ))}
      </div>
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
