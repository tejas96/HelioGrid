/**
 * Breadcrumb — the shared prop contract.
 *
 * POINTER SURFACE — the design system gives this component no phone form, and the phone shell
 * has no slot to put one in. There is deliberately no `Breadcrumb.native.tsx`. Two independent
 * sources say so, which is what the waiver requires:
 *
 *   · The DS component itself — `components/navigation/Breadcrumb.jsx`, its `.d.ts` and its
 *     `.prompt.md` all open the same way: "desktop only. On a phone the back affordance is the
 *     sheet or the top bar, never a trail."
 *   · The shell that would host it — `AppShell.jsx` gives `AppHeader` a `breadcrumb` slot and
 *     renders it above the title. `MobileTopBar`, the phone counterpart in the same file, has no
 *     such prop; its leading position is a back/menu affordance and `BottomNav` is destinations,
 *     not location. A native half would have nowhere to mount and no DS drawing to port from.
 *
 * This is NOT "not ported yet" — that case is list 1 of `ds:check`, not a waiver. This file still
 * has to stay platform-neutral because both tsconfig projects compile it.
 */
export interface BreadcrumbItem {
  key?: string;
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Longer trails collapse in the middle; root and current page always stay. */
  maxItems?: number;
  onNavigate?: (item: BreadcrumbItem) => void;
}
