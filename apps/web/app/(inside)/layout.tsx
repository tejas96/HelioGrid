import type { ReactNode } from 'react';
import { SessionGate } from '../../features/auth';

/** The inside group — signed in with a company. The gate lives here once; a page under this folder holds none. */
export default function InsideLayout({ children }: { children: ReactNode }) {
  return <SessionGate need="signed-in">{children}</SessionGate>;
}
