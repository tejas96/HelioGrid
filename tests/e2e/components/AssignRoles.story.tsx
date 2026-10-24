import {
  type AssignRolesRefusal,
  firstNameOf,
  formatPhone,
  grantLine,
  IN_PACK,
  inMatrixOrder,
  type PresetLock,
  type RolePreset,
  roleChange,
  saveRolesOff,
  type TeamRow,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  assignRolesRefusalWords,
  assignRolesWords,
  createTranslator,
  grantLineWords,
  removeRolesWords,
  teamStatusWord,
} from '@heliogrid/i18n';
import { AssignRoles } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * Assign Roles as the Team screen holds it: the person's held presets, ticks kept in F2 order, the
 * grant line and Save's reason from domain, every word in `reader`'s language. The frame reports a
 * save as `data-saved` (the set sent) and a close as `data-closed`. `refusal` draws a save that did
 * not land; `state` the skeleton; `removing` the removal's confirm standing over it.
 */
export function AssignRolesAsHeld({
  reader,
  name = 'Vikram Deshpande',
  held,
  locks = {},
  state = 'ready',
  refusal = null,
  removing = null,
}: {
  reader: UiLanguage;
  name?: string;
  held: readonly RolePreset[];
  locks?: Partial<Record<RolePreset, PresetLock>>;
  state?: 'ready' | 'loading';
  refusal?: AssignRolesRefusal | null;
  /** The ticks a save would leave, asking first — the removal's confirm over the editor. */
  removing?: readonly RolePreset[] | null;
}) {
  const { t } = READERS[reader];
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<readonly RolePreset[]>(held);
  const [saved, setSaved] = useState('');
  const firstName = firstNameOf(name);
  const words = assignRolesWords(t, { firstName, companyName: 'Suryodaya Solar', locks });
  const { speakers } = grantLine(picked);
  const person: TeamRow = {
    id: 'vikram',
    name,
    phoneE164: '+919876543210',
    roles: held,
    status: 'active',
    isViewer: false,
    lastActiveAt: null,
    expiresAt: null,
    inviteDay: null,
  };
  return (
    <div
      lang={reader}
      data-saved={saved}
      data-closed={!open}
      style={{ position: 'relative', minHeight: '100dvh' }}
    >
      <AssignRoles
        open={open}
        onClose={() => setOpen(false)}
        person={{
          name,
          status: { label: teamStatusWord(t, 'active'), tone: 'success' },
          phone: formatPhone(IN_PACK.formats, '+919876543210'),
        }}
        words={words}
        rows={words.rows}
        picked={picked}
        onPick={(next) => setPicked(inMatrixOrder(next))}
        grant={{ speakers, parts: grantLineWords(t, firstName, speakers).parts }}
        saveOffReason={words.saveOff(saveRolesOff(person, picked))}
        saving={false}
        onSave={() => setSaved(picked.join(','))}
        state={state}
        removal={
          removing === null
            ? null
            : {
                words: removeRolesWords(t, { name, change: roleChange(held, removing) }),
                onGo: () => setSaved(removing.join(',')),
                onLeave: () => setSaved('kept'),
              }
        }
        refusal={
          refusal === null
            ? null
            : assignRolesRefusalWords(t, refusal, { firstName, companyName: 'Suryodaya Solar' })
        }
      />
    </div>
  );
}
