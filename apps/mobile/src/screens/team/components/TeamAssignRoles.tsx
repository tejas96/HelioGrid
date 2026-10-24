import { type AssignRolesEditor, type Team, useAssignRoles } from '@heliogrid/data/react';
import {
  assignRolesShown,
  removeRolesWords,
  rolesRemovedToast,
  rolesUndoFailedToast,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { AssignRoles, TEAM_STATUS_TONE, type ToastQueue, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { useRolesReferenceDoor } from '../hooks/use-roles-reference-door';

/**
 * `useAssignRoles` for the Team page: a landed removal raises its toast and *Undo* (`m-after`).
 * `onUndone` gives the keyboard a place once *Undo* has left with its toast — unless the editor is
 * open, whose trapped panel keeps it.
 */
export function useTeamRoles(
  team: Team,
  toasts: ToastQueue,
  companyName: string,
  onUndone: () => void,
) {
  const t = useTranslate();
  const open = useRef(false);
  const roles = useAssignRoles(team, {
    onRemoved: (removal, undo) => {
      const { undoLabel, ...toast } = rolesRemovedToast(t, removal);
      toasts.push({
        ...toast,
        undo: {
          label: undoLabel,
          onUndo: () => {
            undo();
            if (!open.current) onUndone();
          },
        },
      });
    },
    onUndoFailed: (refusal, removal) => {
      toasts.push(rolesUndoFailedToast(t, refusal, { ...removal, companyName }));
    },
  });
  open.current = roles.open;
  return roles;
}

/**
 * Assign Roles over the Team page (`SCR-M01-13`): the person the row opened, their ticks, the grant
 * line and the removal's confirm, in the reader's words. `useAssignRoles` holds the state and the
 * save; this composes.
 */
export function TeamAssignRoles({
  editor,
  companyName,
}: {
  editor: AssignRolesEditor;
  companyName: string;
}) {
  const t = useTranslate();
  /* The round *Roles reference*: the editor steps aside, keeping its ticks, and the page opens. */
  const openReference = useRolesReferenceDoor(editor);
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
      rows={shown.words.rows}
      picked={editor.picked}
      onPick={editor.pick}
      grant={shown.grant}
      saveOffReason={shown.saveOffReason}
      saving={editor.saving}
      onSave={editor.save}
      onReference={openReference}
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
