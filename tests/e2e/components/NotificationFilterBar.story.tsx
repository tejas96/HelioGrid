import { centreFilterWords, createTranslator } from '@heliogrid/i18n';
import { NotificationFilterBar } from '@heliogrid/ui';
import { useState } from 'react';

const en = await createTranslator('en');

/**
 * The bar as a screen holds it: its on/off state lives with the caller, so the spec sees one
 * group give way to the next. The state is bound here, in the browser, as the screen binds it.
 */
export function FilterBarAsHeld() {
  const [unreadOn, setUnreadOn] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  return (
    <NotificationFilterBar
      {...centreFilterWords(en.t)}
      unreadOn={unreadOn}
      onUnread={setUnreadOn}
      openGroup={openGroup}
      onGroup={setOpenGroup}
    />
  );
}
