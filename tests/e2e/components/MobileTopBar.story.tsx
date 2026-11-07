import { createTranslator, SHELL, settingsRowName } from '@heliogrid/i18n';
import { BarScrollContext, createBarScroll, MobileTopBar } from '@heliogrid/ui';
import { useMemo } from 'react';

const en = await createTranslator('en');

/**
 * `MobileTopBar` over a page that scrolls, the page telling the bar how far as the shell's frame
 * does: the scroll and its listeners live in the browser, so they cannot be handed to `mount`.
 */
export function ScrollingTopBar() {
  const scroll = useMemo(createBarScroll, []);
  return (
    <BarScrollContext.Provider value={scroll}>
      <div style={{ width: 375 }}>
        <MobileTopBar
          searchLabel={en.t(SHELL.search)}
          notificationsLabel={en.t(SHELL.notifications)}
          title={settingsRowName(en.t, 'team')}
        />
        <div
          data-testid="page"
          style={{ height: 300, overflow: 'auto' }}
          onScroll={(event) => scroll.tell(event.currentTarget.scrollTop)}
        >
          <div style={{ height: 2000 }} />
        </div>
      </div>
    </BarScrollContext.Provider>
  );
}
