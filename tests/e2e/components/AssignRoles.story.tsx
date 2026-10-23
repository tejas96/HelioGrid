import {
  firstNameOf,
  formatPhone,
  grantLine,
  IN_PACK,
  inMatrixOrder,
  type PresetLock,
  type RolePreset,
  saveRolesOff,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  assignRolesWords,
  createTranslator,
  grantLineWords,
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
 * save as `data-saved` (the set sent) and a close as `data-closed`.
 */
export function AssignRolesAsHeld({
  reader,
  name = 'Vikram Deshpande',
  held,
  locks = {},
}: {
  reader: UiLanguage;
  name?: string;
  held: readonly RolePreset[];
  locks?: Partial<Record<RolePreset, PresetLock>>;
}) {
  const { t } = READERS[reader];
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<readonly RolePreset[]>(held);
  const [saved, setSaved] = useState('');
  const firstName = firstNameOf(name);
  const words = assignRolesWords(t, { firstName, companyName: 'Suryodaya Solar', locks });
  const { speakers } = grantLine(picked);
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
        saveOffReason={words.saveOff(saveRolesOff(held, picked))}
        saving={false}
        onSave={() => setSaved(picked.join(','))}
      />
    </div>
  );
}
