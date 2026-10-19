import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Chip/Chip';
import { RecordCard } from '../NextAction/RecordCard';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import type { MemberCardProps, MemberInvite } from './MemberCard.types';

function InviteDays({ invite }: { invite: MemberInvite }) {
  return (
    <div className="hg-member-card-invite">
      <ProgressBar value={invite.progress} />
      <div className="hg-member-card-invite-words">
        <span className="hg-member-card-day">{invite.day}</span>
        <span className="hg-member-card-expires">{invite.expires}</span>
      </div>
    </div>
  );
}

/** A person on the team, on a phone (`SCR-M01-12`): a stacked `RecordCard`. */
export function MemberCard({
  name,
  mark,
  youLabel,
  line,
  roles,
  invite,
  action,
  onOpen,
}: MemberCardProps) {
  return (
    <RecordCard
      layout="stacked"
      name={name}
      avatar={<Avatar name={name} size={48} mark={mark} />}
      badge={
        youLabel === undefined ? undefined : (
          <Badge tone="accent" density="functional">
            {youLabel}
          </Badge>
        )
      }
      line={line}
      marks={roles.map((role) => (
        <Badge key={role.label} tone={role.tone} density="functional">
          {role.label}
        </Badge>
      ))}
      detail={invite === undefined ? undefined : <InviteDays invite={invite} />}
      action={action}
      onClick={onOpen}
    />
  );
}
