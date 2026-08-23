/* The print-scope registry, in its own module so nothing has to import in a circle.

   `PrintScope` (components/PagedDocument) provides it; `Disclosure` (components/Disclosure)
   consumes it. A mandatory disclosure that finds itself inside a print-SUPPRESSED region registers
   itself here, and the scope renders it again in a print-only clone beside the suppressed block —
   so SCR-M06-13's internal details stay off the paper while MS9-16's staleness warning still
   prints. CSS alone cannot do this: `display:block !important` never beats an ancestor's
   `display:none`.

   `spec` is data, never a node: the scope re-renders the disclosure itself, which is what keeps the
   verbatim wording in one place. */
import { createContext } from 'react';
import type { DisclosureSpec } from '../components/Disclosure/Disclosure.types';

export interface PrintScopeApi {
  /** True when this region is suppressed on paper — a mandatory line inside it must hoist. */
  suppressed: boolean;
  register: (id: string, spec: DisclosureSpec) => void;
  unregister: (id: string) => void;
}

export const PrintScopeContext = createContext<PrintScopeApi | null>(null);
