import { Tabs } from '../tabs';

/**
 * Authenticated routes.
 *
 * `Tabs` nests the bottom-tab navigator; stack-level routes that should COVER the tab bar
 * (detail screens, modals) are siblings of it here rather than members of `tabs.tsx`.
 *
 * Adding a module's screen is ONE entry in this object: its param type, its deep link
 * (`linking: 'leads/:leadId'`) and its auth gate all follow from it. Params come from the
 * screen's own `StaticScreenProps<…>`, so they are never declared twice.
 *
 * When roles land, group by CAPABILITY — never by role. Roles are stackable, so a role-keyed
 * group would declare a shared screen twice, and duplicate route names are a hard throw.
 */
export const appScreens = {
  Tabs: { screen: Tabs },
};
