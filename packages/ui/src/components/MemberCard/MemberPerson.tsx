import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Chip/Chip';
import type { MemberPersonProps } from './MemberCard.types';

/** A person in the team table's first cell (`MemberPersonProps`). */
export function MemberPerson({ name, youLabel, phone }: MemberPersonProps) {
  return (
    <div className="hg-member-person">
      <Avatar name={name} size={32} />
      <div className="hg-member-person-who">
        <span className="hg-member-person-name">
          {name}
          {youLabel === undefined ? null : (
            <Badge tone="accent" density="functional">
              {youLabel}
            </Badge>
          )}
        </span>
        <span className="hg-member-person-phone">{phone}</span>
      </div>
    </div>
  );
}
