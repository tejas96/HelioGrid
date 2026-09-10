# Tasks — SHELL (app shell & platform surfaces)

Task-id prefix: `T-SHELL-`. One screen task per shell screen — a screen whose reach exceeds the ceiling (`M111`) is split by platform, the DESIGN line staying with the first slice. Rules per `docs/tasks/README.md`:
acceptance criteria are copied verbatim from the PRD, never rewritten; `DESIGN: PENDING`
blocks build, not start. Briefs live in `docs/ux/briefs/`.

---

### T-SHELL-007 · The shell's data flow — my membership, the coach-mark dismissal, the home choice and why a session ended
**Type:** engine · **Tier:** P0
**Status:** planned
**Why:** Both shells read the same facts — who I am, which company, which home is in force and which presets are composed into it, how many coach marks I have dismissed, the market's grievance contact — and write two of them; without one flow in `packages/data` each platform would fetch and hold them its own way, a dismissal would live in a browser's storage instead of on the membership (`F4-36`), and neither shell screen could be built under the PR ceiling (`M111`).
**PRD rows:** M01-16, MS12-19
**Design:** none — an engine task; the surfaces are `T-SHELL-001` (375) and `T-SHELL-008` (1536).
**Data model:** none new — reads and writes `tenant_membership.coach_marks_dismissed` (`T-M01-025`, migration 0002; 0–3 by its check constraint), reads `tenant` (`companyName`, `marketCode`) and the current `market_pack_version` (`T-FCORE-016`). No table, no column.
**Contract:** `packages/contracts/src/tenant.ts` — one router, additive: `GET /tenants/me/membership` (the caller's own membership: `membershipId`, `roles`, `status`, `coachMarksDismissed`) and `PATCH /tenants/me/membership` (body `{ coachMarksDismissed: 0..3 }`; a count below the stored one is refused `DOMAIN_RULE_VIOLATION` — a dismissal never un-dismisses); session access, no capability row (a person's own record, like `PATCH /users/me`). OpenAPI re-emitted. The session projection and the auth router do not change.
**Depends on:** `T-M01-025` (shipped, #40 — the column, `GET /tenants/me`, the guard, the store) · `T-FCORE-016` (shipped, #39 — `GET /market-packs/:marketCode`) · `T-FPLAT-025` (shipped, #51 — `centreVerbFor`, `standingDestinationsFor`) · `T-M13-006` (PR #52 — `composedHome`, `homesOf`).
**Out of scope:** every rendering and every state — `T-SHELL-001`, `T-SHELL-008`; the `dataRights` content — `T-FCORE-009`; the availability pill's read and write — `T-M07-027`; the search and the bell — `T-SHELL-002`, `T-SHELL-003`; the sign-out request itself — exists (`T-M01-025`'s store method); the deactivation that makes a session refused — `T-FPLAT-003`.
**Ruled at `/start`:**
- **The shell's facts are ONE hook, `useShell()` in `packages/data/src/react/`** (Law 11): the home in force and the composed presets (`composedHome(roles, chosen)`), the switcher's list (`homesOf`), the centre verb and the four slots (`T-FPLAT-025`), the tenant's name, the coach-mark count and the pack's `dataRights` value or `null` where the key is unauthored (`F1-09`). Each platform renders it; neither computes it.
- **The chosen home is the session store's, in memory** — `chooseHome(preset)`; never persisted (`M13-09`, `F4-36`); cleared by sign-out; a preset no longer held falls back to the ladder (`T-M13-006`).
- **A dismissal is a server write, never a browser key.** `packages/ui`'s `useCoachMarks` writes `localStorage` on web by default and leaves persistence to the caller on native; the shell drives `CoachMarkSequence` from the membership's count and `PATCH`es on each dismissal, so a phone and a desktop agree and nothing is held on the device.
- **Why a session ended is a domain fact, not a guess.** `packages/domain/src/auth/session-policy.ts` gains `sessionEndedBecause(expiry, refusedAt)`: a refusal while `isSessionLive` is `'access-removed'`, after expiry it is `'expired'`; a sign-out is `'signed-out'`. The store carries it as `SessionSnapshot.ended` (`'signed-out' | 'access-removed' | 'expired' | null`) when a call is refused after the transport's one refresh; no wire change — the refusal reason `admit` computes stays server-side, and the client already holds `expiresAt`.
- **The access-removed state renders wherever the person lands next** — the shell's frame today (`T-SHELL-001`, `T-SHELL-008`), the sign-in door once `T-M01-001` lands — from the same `ended` fact, so no screen invents a second reason.

**PRD rows (verbatim):**

- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**DONE WHEN:**
- Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → proof: unit `apps/api/tests/tenant/my-membership.test.ts` — `PATCH /tenants/me/membership` accepts 0, 1, 2, 3, refuses 4 and refuses a count below the stored one (seen red on a handler that writes whatever it is sent); qa-api — `GET /tenants/me/membership` answers the caller's own row only, roles and count equal to `tenant_membership`, and a second member's row is never reachable; the three marks on screen are `T-SHELL-001`'s and `T-SHELL-008`'s (qa-mobile, qa-web)
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → proof: unit `packages/domain/tests/auth/session-policy.test.ts` — a refusal one second before `expiresAt` is access removed, one second after is expired, and a sign-out is signed-out (seen red on a policy that calls every refusal expired); qa-api — `POST /auth/sign-out` then `GET /auth/session` answers `UNAUTHENTICATED` and a held draft is intact on signing back in (`T-M01-025`'s held-work store); the OTP, Google, language and units halves are proven at `T-M01-001` and `T-M01-011`

---

### T-SHELL-001 · App Shell & Navigation — mobile
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** A rep in a customer's living room reaches Add lead with one thumb and a surveyor reaches Start survey the same way, and every person lands on their own work with the company's name in the bar; without it each module invents its own navigation and the two-minutes-to-useful-work promise has nowhere to land. The phone is the flagship shell (`F7-22`'s arc bar), so it lands first; the desktop shell is `T-SHELL-008`.
**PRD rows:** F1-59, F7-22, M01-16, M01-17, M02-06, M13-10, MS12-19
**BRIEF:** docs/ux/briefs/SCR-SHELL-01-app-shell.md
**DESIGN:** SCR-SHELL-01 → https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-SHELL-01+App+Shell+-+Mobile.dc.html

**PRD rows (verbatim):**

- **F1-59** (P0, `docs/prd/foundations/F1-global-market-framework.md`) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.
- *Row removed 2026-08-07 by owner decision: `F4-22` (Surface 1 — the persistent global sync indicator) was deleted with the offline/sync capability. `docs/prd/foundations/F4-data-integrity.md` §5 forbids a global connection indicator, and the shell shows no connectivity state at all; the one surviving carve-out — field photographs held on the device — states its waiting count and retry on the capture screen (SCR-M04-07) and nowhere else (`F4-21`, `M04-55`).*
- **F7-22** (P0, `docs/prd/foundations/F7-design-language.md`) — **The mobile shell is an arc bar with an elevated centre action; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is an arc with a raised centre action that is **near-black — the primary-action colour, not a brand colour** — carrying an ink glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). The surrounding slots are the persona's few standing destinations. Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions.
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M01-17** (P0, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank.
- **M02-06** (P0, `docs/prd/modules/M02-crm-and-leads.md`) — **Quick add is one tap from the primary add action on every surface.** On mobile it is the shell's elevated centre action; on web it is the primary action on the leads surface. The capture screen itself is a single screen with the duplicate check running live on the phone field as it is typed (M02-07).
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule: one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**Data model:** none — every fact arrives through `T-SHELL-007`'s `useShell()`: `tenant` (the company name), `tenant_membership` (the held presets, the coach-mark count), the pack's `dataRights` key (unauthored until `T-FCORE-009`; the menu item renders the unauthored-key state until then).
**Contract:** none of its own — `GET /auth/session`, `GET /tenants/me`, `GET`/`PATCH /tenants/me/membership`, `GET /market-packs/{marketCode}`, `POST /auth/sign-out`, all through `packages/data` (`T-M01-025`, `T-FCORE-016`, `T-SHELL-007`). Domain it reads, adds none: `centreVerbFor`, `standingDestinationsFor` (`T-FPLAT-025`), `composedHome`, `homesOf`, `HOME_LADDER` (`T-M13-006`), `sessionEndedBecause` (`T-SHELL-007`). The availability read and write are `T-M07-027`'s and the pill lands with that task inside this bar.
**Depends on:** `T-SHELL-007` (the hook, the membership routes, the `ended` fact) · `T-M13-006` (PR #52) · `T-FPLAT-025` (shipped, #51) · `T-M01-025` (shipped, #40) · `T-M01-028` (shipped, #47 — the accept whose hand-off lands on this home) · `T-M01-001` (the sign-in door — no screen signs a person in on the phone today, so this shell cannot be reached on a device before it; its OTP half is enough) · `packages/ui` `AppShell`, `BottomNav`, `Fab`, `MobileTopBar`, `TenantHeader`, `Menu`, `CoachMark`, `LogoTile`, `EmptyState` (landed).
**Out of scope:** the desktop shell, the rail and the header at 1536 — `T-SHELL-008`; the data flow, the membership routes and the `ended` fact — `T-SHELL-007`; the breach-notification duty and the `dataRights` content — `T-FCORE-009`; the verb and slot resolution — `T-FPLAT-025`; the ladder, the home resolution and every home's CONTENT — `T-M13-006` and the owning modules' home screens (the home region shows the teaching empty state until a module's home lands); the Quick Add Lead capture screen — `T-M02-001` (the centre action navigates to its route and lands on the module's placeholder until then); the survey capture — M04; the availability pill — `T-M07-027`; the forced-upgrade screen — `T-FPLAT-033`; the deactivation itself — `T-FPLAT-003`; the search box's and the bell's own surfaces — `T-SHELL-002`, `T-SHELL-003`; the billing banner — `T-SHELL-006`; sign-in and Google — `T-M01-001`; language and units — `T-M01-011`.
**DONE WHEN:**
- Given a breach event, when duties trigger, then the Data Protection Board and affected principals are notified and the grievance contact is published in-app (F1-59). → proof: qa-mobile the avatar menu at 375px carries the grievance contact read from the pack's `dataRights` key, rendering the unauthored-key state while the key is absent; the notification duty is proven at `T-FCORE-009`
- **Given** the mobile application, **when** the shell renders for any persona, **then** the arc centre is the near-black primary action with a fixed glyph and a role-appropriate verb (`F7-22`). → proof: qa-mobile sign in as a Sales Executive and again as a Survey Engineer: the arc centre is the near-black primary-action token with the same plus glyph, and the verb reads Add lead then Start survey; the resolution is unit-proven at `T-FPLAT-025`
- Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → proof: qa-mobile sign in as a Sales Executive and again as a Survey Engineer: the arc centre is the near-black primary-action token with the same plus glyph, and the verb reads Add lead then Start survey; the resolution is unit-proven at `T-FPLAT-025`
- Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → proof: qa-mobile a first sign-in shows at most three `CoachMark` items on the screen landed on, each dismissed on its own, absent after a relaunch and absent on a second device — the count is the membership's (`T-SHELL-007`) — and no carousel exists on the route
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → proof: qa-mobile accept an invite as a Sales Executive: the first screen after the role card is the home in force inside this shell — My Day's route, its region showing the teaching empty state until M07's My Day lands — never a generic dashboard or a blank; the atomic write is unit-proven at `T-M01-028`; the name/photo and role-card screens are `T-M01-009`'s and `T-M01-010`'s
- Given any surface, when the primary add action is used, then quick add opens in one tap and the duplicate check runs live on the phone field (M02-06). → proof: qa-mobile from the home of each preset that may add leads (EPC Owner, Sales Manager, Sales Executive) the centre action opens Quick Add Lead's route in one tap, and from a Survey Engineer's it opens the survey capture's — the verb per home is `T-FPLAT-025`'s; the capture screen and its live duplicate check are proven at `T-M02-001`
- Given any combination of held presets, when the person signs in, then their home is the highest-ladder preset's home with every other held preset's today-block composed inside, and a switcher lists each held preset's home (M13-10). → proof: qa-mobile sign in holding Sales Executive + Survey Engineer: the home is My Day's route with the Survey Engineer's block region composed in (its teaching empty state until M04's visits land), the title switcher lists both homes, and switching swaps which body of work is the home's own; the derivation is unit-proven at `T-M13-006`
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → proof: qa-mobile sign out from the avatar menu with a draft open: the app returns to the door, `GET /auth/session` answers no session, and the draft is intact on signing back in; the OTP, Google, language and units halves are proven at `T-M01-001` and `T-M01-011`
- Three base states + brief-listed states present at 375px; zero raw colour literals/off-scale values. → proof: qa-mobile every listed state at 375px — loading, empty (teaching), error, normal, role-adaptive-centre-action, single-preset-trivial, coach-marks-max-3-dismissible, access-removed-graceful (rendered from `ended`); the three availability settings land with `T-M07-027` and update-required with `T-FPLAT-033`; parity with 1536px is proven at `T-SHELL-008`

---

### T-SHELL-008 · App Shell & Navigation — web
**Type:** screen · **Tier:** P0
**Status:** planned
**Why:** The owner, the managers and the studio work the desktop shell at a desk: the same person, company, home, switcher and menu as the phone, in a sidebar-and-header frame; without it every desktop screen would draw its own rail, and the phone and the desktop would drift apart on the one frame both share.
**PRD rows:** F1-59, F7-22, M01-16, M01-17, M13-10, MS12-19
**BRIEF:** docs/ux/briefs/SCR-SHELL-01-app-shell.md
**Design:** the same canvas as `T-SHELL-001`'s DESIGN line, its 1536 artboards — one screen, one register row (`SCR-SHELL-01`), one DESIGN line, kept on the first slice so the ledger stays whole (`M111` split by platform).

**PRD rows (verbatim):**

- **F1-59** (P0, `docs/prd/foundations/F1-global-market-framework.md`) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.
- **F7-22** (P0, `docs/prd/foundations/F7-design-language.md`) — **The mobile shell is an arc bar with an elevated centre action; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is an arc with a raised centre action that is **near-black — the primary-action colour, not a brand colour** — carrying an ink glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). The surrounding slots are the persona's few standing destinations. Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions.
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M01-17** (P0, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank.
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule: one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**Data model:** none — as `T-SHELL-001`, through `T-SHELL-007`'s `useShell()`.
**Contract:** none of its own — as `T-SHELL-001`.
**Depends on:** `T-SHELL-007` · `T-SHELL-001` (the phone shell it must match, state for state) · `T-M13-006` (PR #52) · `T-FPLAT-025` (shipped, #51) · `T-M01-025` (shipped, #40) · `T-M01-001` (the sign-in door on web; until it lands QA establishes the session through the API from the app's origin) · `packages/ui` `AppShell`, `AppRail`, `AppHeader`, `TenantHeader`, `Menu`, `CoachMark`, `LogoTile`, `EmptyState` (landed).
**Out of scope:** everything `T-SHELL-001` lists, plus the phone shell itself; the web primary add action on the leads surface (`M02-06`'s web half) — `T-M02-001`'s leads surface, not the shell.
**DONE WHEN:**
- Given a breach event, when duties trigger, then the Data Protection Board and affected principals are notified and the grievance contact is published in-app (F1-59). → proof: qa-web the avatar menu at 1536px carries the grievance contact read from the pack's `dataRights` key, rendering the unauthored-key state while the key is absent; the notification duty is proven at `T-FCORE-009`
- **Given** the mobile application, **when** the shell renders for any persona, **then** the arc centre is the near-black primary action with a fixed glyph and a role-appropriate verb (`F7-22`). → proof: qa-mobile sign in as a Sales Executive and again as a Survey Engineer: the arc centre is the near-black primary-action token with the same plus glyph, and the verb reads Add lead then Start survey; the resolution is unit-proven at `T-FPLAT-025`
- Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → proof: qa-web at 1536px the shell is the rail-and-header frame carrying the same four destinations as the phone and no fifth slot, with no arc bar and no raised centre; the phone half is proven at `T-SHELL-001`
- Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → proof: qa-web a first sign-in shows at most three `CoachMark` items on the screen landed on, each dismissed on its own and absent after a reload — the count is the membership's, so a mark dismissed on the phone is absent here — and no carousel exists on the route
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → proof: qa-web accept an invite as a Sales Executive: the first screen after the role card is the home in force inside this shell, its region showing the teaching empty state until M07's My Day lands, never a generic dashboard or a blank; the atomic write is unit-proven at `T-M01-028`
- Given any combination of held presets, when the person signs in, then their home is the highest-ladder preset's home with every other held preset's today-block composed inside, and a switcher lists each held preset's home (M13-10). → proof: qa-web sign in holding Sales Executive + Survey Engineer: the home is My Day's route with the Survey Engineer's block region composed in, the title switcher lists both homes, and switching swaps which body of work is the home's own; the derivation is unit-proven at `T-M13-006`
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → proof: qa-web sign out from the avatar menu with a draft open: the app returns to the door, `GET /auth/session` answers no session, and the draft is intact on signing back in; the OTP, Google, language and units halves are proven at `T-M01-001` and `T-M01-011`
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-web every listed state at 1536px · qa-parity every state against `T-SHELL-001`'s at 375px, the same facts from the same hook and the same copy

---

### T-SHELL-002 · Global Search
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** An installer types a phone number from anywhere in the app and the caller's lead, site, proposal or project is one tap away — the phone is the CRM's identity; without it a rep scrolls lists to find who is calling, and a lead marked junk by mistake can never be found again.
**PRD rows:** F6-20, F6-23
**BRIEF:** docs/ux/briefs/SCR-SHELL-02-global-search.md
**DESIGN:** SCR-SHELL-02 → https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-SHELL-02+Global+Search+-+Mobile.dc.html

**PRD rows (verbatim):**

- **F6-20** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
- **F6-23** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake.

**Data model:** none — reads the scope-enforced search read over leads, customers, sites, proposals, projects, catalog items and people that `T-FPLAT-020` builds on the owning modules' tables; the junk state and the Reopen transition are `T-M02-015`'s over `lead`.
**Contract:** none of its own — it calls:
- the one search read — a query returns results grouped by entity type, each carrying its deep-link target and its identity facts (name, phone, city, stage), a lead carrying its junk state, ranked plain — to be declared by `T-FPLAT-020` in `packages/contracts/src/search.ts`
- Reopen on a junk-lead result — the lead lifecycle's reopen transition, to be declared by `T-M02-015`
- See all — each entity's own list screen with the query applied; those routes are the owning modules'
Domain types it reads, adds none: the search-alias law and the plain ranking are `T-FPLAT-020`'s.
**Depends on:** `T-FPLAT-020` (the read, the scope enforcement, the alias law) · `T-SHELL-001` (the `SearchField` in the shell that opens this sheet) · `T-M02-015` (the junk state and Reopen) · `T-M01-025` (migration 0002 — the session whose scopes gate results) · `packages/ui` `SearchField`, `Sheet`, `ListRow` (landed).
**Out of scope:** scope enforcement, the "quote"/"quotation" alias, ranking and the junk-only surfacing rule — `T-FPLAT-020`; the junk and reopen lifecycle — `T-M02-015`; the lists See all opens — `T-M02-003` and each entity's own list task; the dedupe sheet, the one sanctioned cross-scope reveal — `T-M02-008`; the shell frame around the box — `T-SHELL-001`.
**DONE WHEN:**
- Given a junk lead, when its phone number is searched by a user whose scope contains it, then it returns with its junk state visible; and given any list or queue, then it does not appear there (F6-23). → proof: qa-parity search the junk lead's phone as a user whose scope holds it: the row carries the junk mark and a Reopen button in its trailing slot, and the lead inbox and every queue omit it; the scope filter is unit-proven at `T-FPLAT-020`
- (F6-20 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion.) → proof: qa-parity one box in the web header and in the mobile shell; a city query returns rows in every matching entity group, each row a real link to its record; "quote" returns Proposals with every label reading Proposal
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-web every listed state at 1536px · qa-mobile every listed state at 375px

---

### T-SHELL-003 · Notification Center
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** A rep sees "proposal opened" and today's payment due in one bell on both devices and acts from the item itself; without it events reach nobody, the badge lies about what is unread, and the owner's monthly summary has nowhere to land.
**PRD rows:** F4-27, F6-07, F6-12, F6-17, F6-19, M13-21, M13-45
**BRIEF:** docs/ux/briefs/SCR-SHELL-03-notification-center.md
**DESIGN:** SCR-SHELL-03 → https://claude.ai/design/p/2b5c5a1e-561a-4116-a710-63b85f669b70?file=SCR-SHELL-03+Notification+Center+-+Mobile.dc.html

**PRD rows (verbatim):**

- **F4-27** (P0, `docs/prd/foundations/F4-data-integrity.md`) — **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation.
- **F6-07** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Read state travels up only and is set once** — reading on one device reads everywhere; nothing un-reads.
- **F6-12** (P1, `docs/prd/foundations/F6-notifications-and-search.md`) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
- **F6-17** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
- *Row removed 2026-08-07 by owner decision: `F6-18` (the centre works offline) was deleted with the offline/sync capability. Its cached-items and arrive-with-sync clauses died with the cache; its read-state clause survives verbatim at `F6-07` above, and its never-blocking clause at `F4-27` above — both now cited by this task in its own right.*
- **F6-19** (P2, `docs/prd/foundations/F6-notifications-and-search.md`) — **History is bounded and honest:** the centre keeps a practical horizon of items (with read state); the underlying facts live on their records' timelines forever — the centre is an inbox, not an archive, and says so at its horizon.
- **M13-21** (P1, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **If the owner never opens it, a short monthly summary is pushed in-app** — where they actually read things; the same fix as Agent performance's. The notification type registers with `foundations/F6`.
- **M13-45** (P1, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **A monthly agent summary is pushed in-app to the owner** — the nobody-opens-it fix, shared with M13-21's dashboard summary; the notification type registers with `foundations/F6`.

**Data model:** none — reads `notification` and `notification_type` authored by `T-FPLAT-017`, `notification_preference` and the type-groups authored by `T-FPLAT-018`, under the horizon and up-only read-state contract of `T-FPLAT-019`; the two monthly summaries are `T-M13-010`'s records in the same table.
**Contract:** none of its own — it calls:
- the unread count for the badge — from the record, never from push state — to be declared by `T-FPLAT-017`
- the centre's list read — grouped per F6-12, filterable by type-group and read state, newest first, bounded by the horizon and saying so, each item carrying its deep link and its one-step act where the recipient holds it — to be declared by `T-FPLAT-019` in `packages/contracts/src/notification.ts`
- mark read, one item and all — up-only, set once, deletes nothing — to be declared by `T-FPLAT-019`
- each item's one-step act (approve, resend, pay, reassign) — the subject's own route, owned by its module
Domain types it reads, adds none: the type registry, the grouping class and the urgency class are `T-FPLAT-017`'s and `T-FPLAT-018`'s.
**Depends on:** `T-FPLAT-017` (the records, the registry, the badge's source of truth) · `T-FPLAT-018` (the type-groups the filter lists; the immediate class that never groups) · `T-FPLAT-019` (the list, the horizon, up-only read state) · `T-SHELL-001` (the bell in the shell) · `T-M01-025` (migration 0002 — the recipient's session) · `packages/ui` `Sheet`, `DetailPanel`, `Card`, `Banner` (landed).
**Out of scope:** emission, recipient resolution, quiet hours, push delivery and the per-user mutes — `T-FPLAT-018`; the registry and the record model — `T-FPLAT-017`; the scope check behind the honest landing — `T-FPLAT-018`; the two monthly summaries' generation and scheduling — `T-M13-010`; the act each item offers — the subject's own module; the shell frame — `T-SHELL-001`.
**DONE WHEN:**
- Given unread notifications, when the badge renders on any device, then its count derives from the records and matches the list (F6-17). → proof: qa-parity with three unread records the bell badge reads 3 in the web header and in the mobile shell and equals the list's unread count; a push dropped in transit changes neither
- (F4-27, F6-07, F6-12, F6-19, M13-21 and M13-45 carry no dedicated Given/When/Then lines in their PRDs' acceptance blocks; the requirement texts above are the binding criteria — the centre marks read once and up-only per F6-07, and never stands a modal or spinner wall between the reader and their work per F4-27.) → proof: qa-parity open an item on one device and it is read on the other and never un-reads; three proposal-opened events on one day render as one group with three reachable members; the horizon row says the centre is an inbox, not an archive; Mark all read is absent when nothing is unread and no modal or spinner wall stands between the reader and the list; the owner's monthly summary reads in place with the dashboard one control away
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-web every listed state at 1536px · qa-mobile every listed state at 375px

---

### T-SHELL-006 · Billing State Banner & Denial Sheets
**Type:** screen · **Tier:** P0
**Status:** planned
**Why:** An owner whose card failed keeps selling for seven days and is told on every screen exactly what paused and the one tap that fixes it; without it a blocked save is a silent failure and the team assumes the product is broken.
**PRD rows:** M12-06, M12-21, M12-30, M12-31, M12-39, M12-53
**BRIEF:** docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md
**DESIGN:** SCR-SHELL-06 → PENDING

**PRD rows (verbatim):**

- **M12-06** (P0, `docs/prd/modules/M12-platform-billing.md`) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7.
- **M12-21** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law.
- **M12-30** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting.
- **M12-31** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited".
- **M12-39** (P0, `docs/prd/modules/M12-platform-billing.md`) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it.
- **M12-53** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Trial UX: honest countdown, soft expiry, no hostage patterns.** A countdown chip stays subtle until D-7; expiry leads to a plan-pick screen; post-expiry is the soft-block set — create/edit paths blocked with a plan prompt, read + export always working. Expiry must convert, never destroy.

**Data model:** none — reads `subscription` (state, trial expiry, the day inside `past_due`) authored by `T-M12-005`, `entitlement` by `T-M12-008`, the cap rollups over `usage_event` by `T-M12-010`, and `dunning_event` (the rung in force, the forfeiture disclosure flag) by `T-M12-011`; each carries the migration number its task declares when the M12 slice begins.
**Contract:** none of its own — it calls:
- the tenant's billing standing — the `BillingState`, the day inside `past_due`, the trial's days remaining, each cap's position (under the warning, at 80%, at 100% with the grace end, paused) and whether the tenant sits inside a price-protection horizon — to be declared by `T-M12-005` with `T-M12-010` and `T-M12-013`
- the typed denial every gated mutation answers — `ENTITLEMENT_BLOCKED` in `errorEnvelope` (`packages/contracts/src/error.ts`, exists), its details naming the capability, what paused, until when and what resolves it — the details shape to be declared by `T-M12-009`
- the Reactivate, pay and upgrade destinations the banner and the sheet lead to — `T-M12-002`'s and `T-M12-003`'s screens over `T-M12-007`'s hosted checkout
Domain types it reads (`packages/domain/src/commerce/`): `BILLING_STATES`, `BILLING_PHASES`, `STATE_CAPABILITY_MATRIX`, `capabilityStanding`, `isAlwaysOn`, `CAP_WARNING_PERCENT`, `CAP_GRACE_DAYS`, `TRIAL_DAYS`, `forfeitsPriceProtection`. It adds two beside them: the chip's prominence threshold (D-7) as a policy number next to `TRIAL_DAYS`, and the one-banner rule — state before cap, cap before bundle, so one act never draws two banners — as a pure function beside `soft-block.ts`; both names settled at `/start` (Law 11: the rule lands before either platform renders it).
**Depends on:** `T-M12-005` (the machine and its read) · `T-M12-008` (entitlements) · `T-M12-009` (the gates and the typed denial's details) · `T-M12-010` (the cap rollups) · `T-M12-011` (the ladder's rungs and their copy) · `T-M12-013` (the protection-horizon fact behind the forfeiture sentence) · `T-M12-002` (Reactivate) · `T-M12-003` (the plan-pick destination) · `T-SHELL-001` (the shell that hosts the banner and the chip) · `T-M01-025` (migration 0002) · the M12 migration numbers those tasks declare when their slice begins (Law 9) · `packages/ui` `Banner`, `Sheet` (landed).
**Out of scope:** the machine, the timers, the gates, the rollups and the rung copy — `T-M12-005`, `T-M12-009`, `T-M12-010`, `T-M12-011`; the usage screen and its 80% pre-warning — `T-M12-004`; the plan-pick screen — `T-M12-003`; Billing Home and reactivation — `T-M12-002`; the push and SMS rungs — `T-M12-011` over `T-FPLAT-018`; the shell frame — `T-SHELL-001`.
**DONE WHEN:**
- Given a charge failure, when days 0–3 elapse, then everything works with a banner; when day 4 arrives, then exactly the metered features pause; when day 7 passes unpaid, then the state is `halted` with the matrix's always-on rows intact (M12-06). → proof: qa-parity advance a `past_due` tenant through `T-M12-005`'s machine: days 0–3 the banner alone with every surface working; day 4 the banner names voice, AI detections and invites as paused and nothing else; day 7 the halted banner lists the four always-on items and read, export, customer links and the billing screens still work
- Given any state in the matrix and any capability row, when M12's enforcement is audited row by row, then no ✓ has become a block and no block has widened (M12-21, M12-22). → proof: qa-parity attempt each gated mutation in each of the six states and read the denial sheet against `STATE_CAPABILITY_MATRIX`: every ✓ acts, every block is refused at the attempt with the Reactivate or upgrade route, and nothing is greyed out beforehand; the matrix itself is unit-proven in `packages/domain/tests/commerce/soft-block.test.ts`
- Given a cap reaching 80%, when the usage screen renders, then the pre-warning is present before any gate has fired (M12-30, M12-34). → proof: qa-web at 80% of a cap the shell draws no banner and no gate has fired; at 100% the cap banner names the type and the grace end; after grace a new creation of that type is refused with the upgrade-or-next-cycle note while editing existing records still works; the usage screen's pre-warning is proven at `T-M12-004`
- Given a first failed charge, when the ladder runs unpaid to day 7, then each rung fires with its stated content, day 4's message names the paused set exactly, and day 7's confirms what still works (M12-39, M12-41). → proof: qa-parity run `T-M12-011`'s ladder unpaid to day 7 on an ordinary and a protected tenant: each rung's banner carries its content, day 4 names the paused set exactly, day 7 confirms the four still-working items, and only the protected tenant's banners carry the forfeiture sentence from day 0
- Given trial expiry, when it lands, then the state is `expired`, the plan-pick screen is the path forward, and read + export + links keep working (M12-53). → proof: qa-parity a trialing tenant at D-8 shows the subtle chip and at D-7 the prominent one; at expiry the banner says the trial has expired, a blocked create shows the plan prompt routing to Plan Selection, and read, export and customer links still work
- (M12-31 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — its message content is exercised by M12-39's line, "day 4's message names the paused set exactly".) → proof: qa-web read every pause message in each launch language: each names what paused, until when and what resolves it, and no "account limited" string exists in `packages/i18n`
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-web every listed state at 1536px · qa-mobile every listed state at 375px

---

## Disposition index

Covers only the screen-task rows quoted in this file. Rows whose engine/policy halves live in
module buckets are dispositioned there.

| Row | Disposition |
|---|---|
| F1-59 | T-SHELL-001 (surface) — non-UI half in owning module file |
| F7-22 | T-SHELL-001 (surface) — non-UI half in owning module file |
| M01-16 | T-SHELL-001 |
| M01-17 | T-SHELL-001 (surface) — non-UI half in owning module file |
| M02-06 | T-SHELL-001 (shell placement) — capture-screen half on SCR-M02-01 in the M02 task file |
| M07-46 | T-SHELL-001 |
| M13-10 | T-SHELL-001 (surface) — non-UI half in owning module file |
| MS12-19 | T-SHELL-001 (surface) — non-UI half in owning module file |
| F6-20 | T-SHELL-002 |
| F6-23 | T-SHELL-002 (surface) — non-UI half in owning module file |
| F4-27 | T-SHELL-003 (surface) — the never-blocking half; the row itself is dispositioned in `docs/tasks/F-platform.md` |
| F6-07 | T-SHELL-003 (surface) — non-UI half in owning module file |
| F6-12 | T-SHELL-003 |
| F6-17 | T-SHELL-003 |
| F6-18 | *removed 2026-08-07 with the offline/sync deletion — read-state half rehomed to `F6-07`, never-blocking half to `F4-27`, both above* |
| F6-19 | T-SHELL-003 (surface) — non-UI half in owning module file |
| M13-21 | T-SHELL-003 (surface) — non-UI half in owning module file |
| M13-45 | T-SHELL-003 (surface) — non-UI half in owning module file |
| M12-06 | T-SHELL-006 (surface) — non-UI half in owning module file |
| M12-21 | T-SHELL-006 (surface) — non-UI half in owning module file |
| M12-30 | T-SHELL-006 (surface) — non-UI half in owning module file; usage-screen half on SCR-M12-04 in the M12 task file |
| M12-31 | T-SHELL-006 |
| M12-39 | T-SHELL-006 (surface) — non-UI half in owning module file |
| M12-53 | T-SHELL-006 (surface) — non-UI half in owning module file; plan-pick half on SCR-M12-03 in the M12 task file |
