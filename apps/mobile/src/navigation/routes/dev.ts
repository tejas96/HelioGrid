import { GalleryScreen } from '../../screens/gallery/GalleryScreen';

/**
 * Dev-only. The Dev group's `if` is `__DEV__`, so these never mount in a release build —
 * though the screen's code still ships, because this import is static.
 */
export const devScreens = {
  /** `heliogrid://gallery` — the path lives ON the route, never in a parallel link map. */
  Gallery: { screen: GalleryScreen, linking: 'gallery' },
};
