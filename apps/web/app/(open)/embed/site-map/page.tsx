import { SiteMapScreen } from '../../../../features/studio/site-map';

/**
 * Route entry for /embed/site-map — routing only. In the open group: the phone app's web view has
 * no web session, and the page holds no company's data (`SCR-M05-01`).
 */
export default function SiteMapPage() {
  return <SiteMapScreen />;
}
