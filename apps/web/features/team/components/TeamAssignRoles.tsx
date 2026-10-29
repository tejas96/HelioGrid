'use client';
import type { TeamRolesEditor } from '@heliogrid/data/react';
import { assignRolesShown, removeRolesWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { AssignRoles, TEAM_STATUS_TONE, useFormat } from '@heliogrid/ui';

/**
 * Assign Roles over the Team page (`SCR-M01-13`): the person the row opened, their ticks, the grant
 * line and the removal's confirm, in the reader's words. `useTeamScreen` holds the state and the
 * save; this composes.
 */
export function TeamAssignRoles({
  editor,
  companyName,
  onReference,
}: {
  editor: TeamRolesEditor;
  companyName: string;
  /** The round *Roles reference*: the editor steps aside, keeping its ticks, and the page opens. */
  onReference: () => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { person, confirm } = editor;
  if (person === null) return null;
  const shown = assignRolesShown(t, { ...editor, ...person, companyName });
  return (
    <AssignRoles
      open={editor.open}
      onClose={editor.close}
      person={{
        name: person.name,
        status: { label: shown.status, tone: TEAM_STATUS_TONE[person.status] },
        phone: format.phone(person.phoneE164),
      }}
      words={shown.words}
      read={editor.rowsRead(shown.words.rows)}
      picked={editor.picked}
      onPick={editor.pick}
      grant={shown.grant}
      saveOffReason={shown.saveOffReason}
      saving={editor.saving}
      onSave={editor.save}
      onReference={onReference}
      refusal={shown.refusal}
      removal={
        confirm === null
          ? null
          : {
              words: removeRolesWords(t, { name: person.name, change: confirm }),
              onGo: editor.removeConfirmed,
              onLeave: editor.cancelRemove,
            }
      }
    />
  );
}
