import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PortalHostProps, PortalProps } from './Portal.types';

/** Web portals target document.body via createPortal. Renders nothing during SSR. */
export function Portal({ children }: PortalProps): ReactNode {
  if (typeof document === 'undefined') {
    return null;
  }
  return createPortal(children, document.body);
}

/**
 * No-op on web — createPortal needs no host. Exported so the app root mounts ONE
 * PortalHost on both platforms; the native half is where it earns its keep.
 */
export function PortalHost({ children }: PortalHostProps): ReactNode {
  return children;
}
