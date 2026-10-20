import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Chip/Chip';
import { StatusChip } from '../StatusChip/StatusChip';
import type { MemberPersonProps } from './MemberCard.types';

/** A person in the team table's first cell (`SCR-M01-12`, `d-default`). */
export function MemberPerson({ name, youLabel, status, tone }: MemberPersonProps) {
  return (
    <div className="hg-member-person">
      <Avatar name={name} size={40} />
      <div className="hg-member-person-who">
        <span className="hg-member-person-name">
          {name}
          {youLabel === undefined ? null : (
            <Badge tone="accent" density="functional">
              {youLabel}
            </Badge>
          )}
        </span>
        <StatusChip label={status} tone={tone} density="functional" />
      </div>
    </div>
  );
}
