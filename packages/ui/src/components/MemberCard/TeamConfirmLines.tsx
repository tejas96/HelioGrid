import { Text } from '../../primitives/Text/Text';
import type { TeamConfirmWords } from './MemberCard.types';

/**
 * A confirm's lines: what the act does, quiet, then — on a roles removal — the way back, with its
 * lead in bold (`SCR-M01-13` m-confirm). Either may be absent; nothing is drawn for one that is.
 */
export function TeamConfirmLines({ body, note }: Pick<TeamConfirmWords, 'body' | 'note'>) {
  return (
    <div className="hg-team-confirm-lines">
      {body === undefined ? null : (
        <Text variant="body-sm" color="secondary">
          {body}
        </Text>
      )}
      {note === undefined ? null : (
        <Text variant="body-sm">
          <Text as="span" variant="body-sm" bold>
            {note.lead}
          </Text>
          {note.rest}
        </Text>
      )}
    </div>
  );
}
