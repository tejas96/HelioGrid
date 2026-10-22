import { Text } from '../../primitives/Text/Text';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Chip/Chip';
import { FactRow, FactRows } from '../FactRow';
import { useFormat } from '../MarketProvider';
import type { InviteLandingWords } from './InviteLanding.types';

/* The board's inviter row: a 40 disc at 375, a 56 disc in the 1536 context pane. */
const DISC = { narrow: 40, wide: 56 } as const;

/** Who invited: the disc, the name and *EPC Owner · {company}* (`SCR-M01-08` m-normal, d-normal). */
export function InviterRow({
  inviter,
  wide,
}: {
  inviter: NonNullable<InviteLandingWords['inviter']>;
  wide: boolean;
}) {
  return (
    <div className="hg-invite-landing-inviter">
      <Avatar name={inviter.name} size={wide ? DISC.wide : DISC.narrow} />
      <div className="hg-invite-landing-inviter-name">
        <Text variant={wide ? 'body' : 'body-sm'} bold>
          {inviter.name}
        </Text>
        <Text variant={wide ? 'body-sm' : 'caption'} color="secondary">
          {inviter.label}
        </Text>
      </div>
    </div>
  );
}

/**
 * The invite's facts: the overline, the roles the inviter set and the number the code went to —
 * a stated value, never a field (brief decision 2) — and the line that names the way out.
 */
export function InviteFactsBlock({
  facts,
  phone,
  wide,
}: {
  facts: NonNullable<InviteLandingWords['facts']>;
  phone: string;
  wide: boolean;
}) {
  const format = useFormat();
  return (
    <div className="hg-invite-landing-facts">
      <Text variant="overline" color="secondary">
        {facts.label}
      </Text>
      <FactRows label={facts.label} density="expressive">
        <FactRow
          label={facts.rolesLabel}
          values={facts.roles.map((role) => (
            <Badge key={role} tone="violet" density="functional">
              {role}
            </Badge>
          ))}
          stack={false}
        />
        <FactRow
          label={facts.phoneLabel}
          value={<Text variant="mono">{format.phone(phone)}</Text>}
        />
      </FactRows>
      <Text variant={wide ? 'body-sm' : 'caption'} color="secondary">
        {facts.line}
      </Text>
    </div>
  );
}
