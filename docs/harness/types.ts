import type { ReactNode } from 'react';

/** One component under test. `name` must match its folder under packages/ui/src/components. */
export type Fixture = { name: string; node: ReactNode };
