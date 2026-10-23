'use client';
import type { AssignRolesEditor } from '@heliogrid/data/react';
import { assignRolesShown } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { AssignRoles, TEAM_STATUS_TONE, useFormat } from '@heliogrid/ui';

/**
 * Assign Roles over the Team page (`SCR-M01-13`): the person the row opened, their ticks and the
 * grant line, in the reader's words. `useAssignRoles` holds the state and the save; this composes.
 */
export function TeamAssignRoles({
  editor,
  companyName,
}: {
  editor: AssignRolesEditor;
  companyName: string;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { person } = editor;
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
      rows={shown.words.rows}
      picked={editor.picked}
      onPick={editor.pick}
      grant={shown.grant}
      saveOffReason={shown.saveOffReason}
      saving={editor.saving}
      onSave={editor.save}
    />
  );
}
