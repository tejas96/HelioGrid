import type { ReactNode } from 'react';
import { SessionGate } from '../../features/auth';

/** The door group — signed-out only. The gate lives here once; a page under this folder holds none. */
export default function DoorLayout({ children }: { children: ReactNode }) {
  return <SessionGate need="signed-out">{children}</SessionGate>;
}
