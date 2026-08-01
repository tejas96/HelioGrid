# ADR-0020: Mobile navigation — React Navigation (native-stack) on bare RN

Date: 2026-07-27

## Context

`apps/mobile` has no navigator. `App.tsx` (216 lines) hand-rolls routing: a
`Session = 'checking' | 'unauthenticated' | { name }` union plus a `showGallery` boolean drive
a ternary chain, screens are "registered" by direct import, movement between them is prop
callbacks (`onSignedIn`, `onBack`, `onOpenGallery`), and the post-login `Home` surface is
defined **inline inside `App.tsx`** rather than in `src/screens/`.

That works for two screens. Thirteen modules are planned (tenancy, crm, survey, design,
proposal, customer-link, projects, billing, catalog, agent, notifications, admin), each
shipping RN screens in lockstep with web (Law 7). A boolean-per-screen router does not survive
that, and it has no answer for the two things the product already requires: **deep links** for
the customer-link module and **notification taps** for the notifications module.

## Decision

**React Navigation v7 with the native-stack navigator.** Exact pins (docs/03 discipline —
registry-latest verified 2026-07-27, compatible with `react-native` 0.86.0 / React 19.2.3):

| Package | Pin | Note |
|---|---|---|
| `@react-navigation/native` | `7.3.14` | core |
| `@react-navigation/native-stack` | `7.18.6` | wraps the platform navigator (UINavigationController / Fragment) |
| `react-native-screens` | `4.26.2` | required peer; **new native dep → `pod install`** |
| `react-native-safe-area-context` | `5.5.2` | required peer, **already a dependency** |

Structure is fixed by `docs/02` §2 (and `apps/mobile/CLAUDE.md` §Local conventions):

```
apps/mobile/
  App.tsx                     ≤40 lines: i18n → SafeAreaProvider → NavigationContainer → RootNavigator
  src/navigation/
    RootNavigator.tsx         the stack; the session gate lives HERE, not in App.tsx
    routes.ts                 RootStackParamList + the route-name const map
    linking.ts                deep-link config (customer-link, push taps) when those land
```

Binding consequences of the decision:

- **Navigation is by typed route name, never prop callbacks.** `RootStackParamList` makes a
  wrong route name or wrong params a **compile error**. A screen's props are its route params.
- **`App.tsx` never imports a screen** — enforced by dependency-cruiser `mobile-app-entry-thin`
  (landed at `warn` 2026-07-27, flips to `error` in this ADR's implementation slice). This is
  what permanently prevents `App.tsx` regrowing a hand-rolled router.
- The inline `Home` becomes `src/screens/home/HomeScreen.tsx`; its raw `Pressable`/`Text`
  styling is replaced with `src/ui` components in the same move (it is a `src/ui` violation
  today, so the relocation is also the fix).
- **Deep links are owned by `src/navigation/linking.ts`** — one place, so customer-link URLs
  and notification taps cannot each invent their own routing path.

## Consequences

- **Native rebuild required.** `react-native-screens` is a native module: `pod install` for
  iOS, Gradle sync for Android, and verification on **both simulators** per the mobile
  Definition of Done. Bare RN means we own this (ADR-0011) — no CNG to automate it.
- One more native dependency in the surface we maintain across RN upgrades. `react-native-screens`
  is, in practice, the same library RN's own recommended navigation stack depends on, so this
  tracks the mainstream upgrade path rather than diverging from it.
- Screens lose their callback props. Every existing screen signature changes in the
  implementation slice — a one-time cost that grows with each screen added before it happens,
  which is the argument for doing it now rather than at module three.
- `NavigationContainer` adds a provider layer; `App.tsx` gets smaller, not larger.
- Native-stack (not JS stack) means real platform transitions and gesture behaviour for free,
  and better memory behaviour on low-end Android — relevant for the field-first audience
  (ADR-0011 context).

## Alternatives rejected

- **Keep the hand-rolled router.** Zero dependency cost, but every new screen adds a boolean
  and a callback chain; no deep-link story for customer-link; no typed params, so a wrong
  navigation target stays a runtime bug. This is the status quo the standard exists to prevent.
- **Expo Router.** File-based routing is a good fit conceptually, but it is Expo-coupled and
  ADR-0011's directive excludes Expo outright.
- **`react-native-navigation` (Wix).** Genuinely native screens, but a heavier native
  integration, a smaller ecosystem, and a much larger blast radius on RN upgrades — a poor
  trade for a team that already owns its native projects by hand.
- **JS stack (`@react-navigation/stack`) instead of native-stack.** More styling control, worse
  performance and non-native gesture feel; native-stack is the current default recommendation.

## Sources

- `../../CLAUDE.md` §Structure (mobile closed set; navigation by typed route name)
- ADR-0011 (bare RN, no Expo — binding), ADR-0017 (WebView studio, a future navigation target)
- Registry versions verified 2026-07-27: `@react-navigation/native@7.3.14`,
  `@react-navigation/native-stack@7.18.6`, `react-native-screens@4.26.2`
- https://reactnavigation.org/docs/native-stack-navigator · https://reactnavigation.org/docs/deep-linking
