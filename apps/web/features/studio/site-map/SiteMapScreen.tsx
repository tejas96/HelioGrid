'use client';
import { GOOGLE_MAPS_KEY } from '../../../lib/env';
import { SiteMapTiles } from '../components/SitePinTiles';
import { useSiteMapHost } from '../hooks/use-site-map-host';

import '../studio.css';

/**
 * The site map page (`SCR-M05-01`): the map under the pin and nothing else, for a phone's web view
 * to show inside Site details. The app around it draws the pin, the words and the buttons; this
 * page holds no customer fact and reads none — the point arrives as a message from its host.
 * `whole`: the app's big map, where one finger moves the map.
 */
export function SiteMapScreen({ whole = false }: { whole?: boolean }) {
  const host = useSiteMapHost(GOOGLE_MAPS_KEY !== undefined);
  return (
    <main className="hg-studio-map-page">
      {GOOGLE_MAPS_KEY === undefined || host.point === null ? null : (
        <SiteMapTiles
          pin={host.point}
          onMove={host.moved}
          onFailed={host.failed}
          mapKey={GOOGLE_MAPS_KEY}
          touch
          whole={whole}
        />
      )}
    </main>
  );
}
