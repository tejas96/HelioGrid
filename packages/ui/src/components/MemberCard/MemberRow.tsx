import { Text } from '../../primitives/Text/Text';
import { Avatar } from '../Avatar/Avatar';
import { CardRow } from '../CardRows';
import { Badge } from '../Chip/Chip';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import type { MemberInvite, MemberRowProps } from './MemberCard.types';

function InviteDays({ invite }: { invite: MemberInvite }) {
  return (
    <span className="hg-member-row-invite">
      <ProgressBar value={invite.progress} />
      <span className="hg-member-row-invite-words">
        <span className="hg-member-row-day">{invite.day}</span>
        <span className="hg-member-row-expires">{invite.expires}</span>
      </span>
    </span>
  );
}

/**
 * A person on the team, one row of the list's glass card (direction A): the face with its status
 * dot, the name with *You*, the status line, every preset held as a badge, an open invite's day of
 * seven — and the row's one act at its end, outside the open target (`CardRow`).
 */
export function MemberRow({
  name,
  mark,
  youLabel,
  line,
  roles,
  invite,
  action,
  onOpen,
  first,
}: MemberRowProps) {
  return (
    <CardRow
      className="hg-member-row"
      first={first}
      open={onOpen === undefined ? undefined : { name, onOpen }}
      aside={action}
    >
      <Avatar name={name} size={40} mark={mark} />
      <span className="hg-member-row-words">
        <span className="hg-member-row-title">
          <span className="hg-member-row-name">{name}</span>
          {youLabel === undefined ? null : (
            <Badge tone="accent" density="functional">
              {youLabel}
            </Badge>
          )}
        </span>
        <Text as="span" variant="body-sm" color="secondary">
          {line}
        </Text>
      </span>
      {roles.length === 0 && invite === undefined ? null : (
        <span className="hg-member-row-under">
          {roles.length === 0 ? null : (
            <span className="hg-member-row-roles">
              {roles.map((role) => (
                <Badge key={role.label} tone={role.tone} density="functional">
                  {role.label}
                </Badge>
              ))}
            </span>
          )}
          {invite === undefined ? null : <InviteDays invite={invite} />}
        </span>
      )}
    </CardRow>
  );
}
