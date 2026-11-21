'use client';
import type { ReactNode } from 'react';

/**
 * A part focus mode may set aside: it fades out while the job in hand does not use it, and back
 * when the job ends (`focus.ts`). Set aside, it takes no tap and no keyboard focus.
 */
export function Shown({ when, children }: { when: boolean; children: ReactNode }) {
  return (
    <span className="hg-studio-focus" data-hidden={!when} inert={!when}>
      {children}
    </span>
  );
}
