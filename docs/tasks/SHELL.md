# Tasks — SHELL (app shell & platform surfaces)

Task-id prefix: `T-SHELL-`. RFC and part-size rules live in `docs/tasks/README.md`. Briefs live in
`docs/ux/briefs/`.

---

### T-SHELL-007 · The shell's data flow — my membership, the coach-mark count and the home choice
**Type:** engine · **Tier:** P0
**Status:** shipped (#198)
**PRD rows:** M01-16 (P1), MS12-19 (P0)
**Design:** none — an engine task; the surfaces are `T-SHELL-001` (375) and `T-SHELL-008` (1536).
**Why:** Both shells read the same facts — which company, which home is in force and which presets are composed into it, how many coach marks I have passed — and write two of them; without one flow in `packages/data` each platform would fetch and hold them its own way, a dismissal would live in a browser's storage instead of on the membership (`F4-36`), and neither shell screen could be built under the size signal (`/start` §2).

**Depends on:** `T-M01-025` (shipped, #40 — the column, `GET /tenants/me`, the guard, the store) · `T-FPLAT-025` (shipped, #51 — `centreVerbFor`, `standingDestinationsFor`) · `T-M13-006` (shipped, #52 — `composedHome`, `homesOf`).
**DONE WHEN:**
- **D1** · Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → `apps/api/tests/tenant/my-membership.test.ts` › "accepts 0 to 3 and refuses anything else"; Q2, Q4; the three marks on screen are `T-SHELL-001`'s and `T-SHELL-008`'s
- **D2** · Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → Q6 — this task's work survives a sign-out; why a session ended is `T-SHELL-009`'s; the OTP, Google, language and units halves are proven at `T-M01-001` and `T-M01-011`

**PRD rows (verbatim):**

- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

---

### T-SHELL-009 · Why a session ended — the refresh names the reason, the transport reports it, the store holds the `ended` fact
**Type:** engine · **Tier:** P0
**Status:** shipped (#199)
**PRD rows:** M01-07 (P0), MS12-19 (P0)
**Design:** none — an engine task. The state it serves is drawn as Frame 8 "access removed" of `SCR-SHELL-01` (`SCR-SHELL-01-App-Shell-Mobile.dc.html` on the SHELL canvas): the top bar keeps the product mark and the company's name, the body is one message, no destinations. It renders at `T-SHELL-001` (375) and `T-SHELL-008` (1536). The sign-in door (`T-M01-001`, shipped) draws no ending; that gap is a `docs/tasks/deferred.md` row.
**Why:** A person whose access was removed must see "your access was removed" — gracefully, no crash, no data lost on the device (`M01` edge `S1.wrong.4`) — and never a false reason. Split from `T-SHELL-007` at its `/start`, whose second actor found the client-side reason wrong four ways on code already on `main`.
**Depends on:** `T-SHELL-007` (shipped, #198) · `T-M01-025` (shipped, #40).
**PRD rows (verbatim):**

- **M01-07** (P0, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **Session lifetimes and revocation.** Web sessions are 30 days rolling. Mobile has no fixed maximum while the person remains active: seven full days without foreground authenticated use expires the session and requires sign-in again. Opening or using the signed-in app in the foreground resets that inactivity window; background refresh, push handling and scheduled work never reset it. Mobile API tokens remain short-lived (≤10 minutes) and renew silently while the underlying session is valid. Deactivating a user, or a user's own "sign out everywhere", kills every device's access within ≤10 minutes. The revocation surface is the Team screen (M01-19).
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**DONE WHEN:**
- **D1** · Given a deactivation or "sign out everywhere", when it is issued, then every session of that user ends within 10 minutes (M01-07). → `apps/api/tests/auth/session-refresh.test.ts` › "refuses a live session whose membership was deactivated, as access removed" and `apps/api/tests/auth/session-refresh.test.ts` › "answers a revoked, expired or unknown session as signed out, never as access removed"; Q1, Q2 — the token those sessions hold lives at most `API_TOKEN_MINUTES` (`packages/domain/src/auth/session-policy.ts`), so no device keeps access past it
- **D2** · Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → recorded R2 — an ending and the sign-out after it keep the device's held work; the OTP, Google, language and units halves are proven at `T-M01-001` and `T-M01-011`

---

### T-SHELL-011 · The shell's composition — every preset's bar, the switcher, the verb and the first-run marks, decided once
**Type:** engine · **Tier:** P0
**Status:** shipped (#208)
**Why:** A Survey Engineer, a Finance lead and a Project Manager each see a bar that holds only the lists they can read, and a rep who also surveys keeps the same four slots when they switch home; today only the three sales presets have a bar, and `useShell()` keys the slots by the home in force, so switching home empties them. Both shells (`T-SHELL-001`, `T-SHELL-008`) render this one decision.
**PRD rows:** F7-48 (P0), M13-10 (P0), M01-16 (P1)
**Design:** none — an engine task; the surfaces are `T-SHELL-001` (375) and `T-SHELL-008` (1536). The coach-mark order is the board's Frame 7 (`SCR-SHELL-01-App-Shell-Mobile.dc.html` on the SHELL canvas): switch home, the availability pill, the centre verb.

**Depends on:** `T-SHELL-007` (shipped, #198 — `useShell()`) · `T-FPLAT-025` (shipped, #51 — `centreVerbFor`, `standingDestinationsFor`) · `T-M13-006` (shipped, #52 — `composedHome`, `homesOf`, `homeFor`).

**PRD rows (verbatim):**

- **F7-48** (P0, `docs/prd/foundations/F7-design-language.md`) — **Each role's standing destinations follow its read grants, and the bar never offers a list the role cannot read.** The pill footer and the rail hold Home, at most two lists the role reads most often from its home, and More — never its home again, and never a module its `F2` grants give it no read on. By preset: EPC Owner — Leads · Projects; Sales Manager — Leads · Proposals; Sales Executive — Leads · Proposals; Survey Engineer — Leads; Design Engineer — Leads · Proposals; Project Manager — none; Field Technician — none; Installation Team Member — none; HR/Admin — People; Finance — Projects; Operations — Leads · Projects; Marketing — Campaigns · Leads. A person holding several presets takes the bar of the preset whose home is theirs (`M13-10`). The pill's add action carries only a verb the preset may perform: a Project Manager, who holds no add-lead grant and whose home names no act, has no add action, and the pill is Home · More alone (owner ruling 2026-09-27).
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule: one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**

**DONE WHEN:**
- **D1** · Each role's standing destinations follow its read grants, and the bar never offers a list the role cannot read (F7-48). → `packages/domain/tests/shell/standing-destinations.test.ts` › "$preset → $set" and "%s sees every list under its thumb"; `packages/domain/tests/shell/shell-view.test.ts` › "keeps the ladder-top preset’s slots whatever home is chosen: $chosen → $verb"
- **D2** · Given any combination of held presets, when the person signs in, then their home is the highest-ladder preset's home with every other held preset's today-block composed inside, and a switcher lists each held preset's home (M13-10). → `packages/domain/tests/shell/shell-view.test.ts` › "composes the ladder’s home and lists every held home"; the rendering is `T-SHELL-001`'s Q3
- **D3** · Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → `packages/domain/tests/shell/coach-marks.test.ts` › "never shows more marks than the first-run cap" and "lists only the marks whose control is on screen"; one at a time and dismissible are `T-SHELL-001`'s Q5

---

### T-SHELL-013 · A read's and an action's state, typed once — loading, empty, failed with its retry, and inert while a save is out
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F7-23 (P0), F7-43 (P0)
**Design:** none — an engine task; it waits on no drawing and changes built screens.
**Why:** A person whose second read fails sees a spinner forever or nothing at all, and text typed while a save is out is dropped: about fifteen hooks each spell a read's state their own way, `state?` is optional on every component that draws one, and seventeen hand-written guards hold a save in flight. One state, owned once, makes a missing state or an unguarded save a compile error.
**Depends on:** `T-M01-020` (its branch is built on the components this task changes).

**PRD rows (verbatim):**

- **F7-23** (P0, `docs/prd/foundations/F7-design-language.md`) — **The ten numbered interaction and accessibility rules are product law, carried unchanged.**
- **F7-43** (P0, `docs/prd/foundations/F7-design-language.md`) — **A screen is done only when it satisfies every item of the per-screen Definition of Done — violating any single item means it is not done.**

**DONE WHEN:**
- **D1** · **Given** any screen, **when** it is audited against the ten rules, **then** it satisfies all ten, and any exception cited is `F7-10`'s overline and nothing else (`F7-23`). → proof, for N10: every read reaches its component as one `Read<T>` owned by `packages/domain` — loading, empty, failed with its words and its retry, ready with its value — built in `packages/data` and required by every `packages/ui` component that draws a read; a planted call with no state, and one that is failed with no retry, each fail `pnpm turbo typecheck`; `packages/data/tests/react/` drives each kind through the real client. While an action is out, its fields and acts are inert and a second press sends nothing: a `packages/data/tests/react/` test of the one action helper that forces the overlap, and a component spec that a pending `Button` refuses a press. No hook hands a screen a raw query result or its own state union: a dependency-cruiser or Biome rule, seen red.
- **D2** · **Given** any screen proposed as complete, **when** it is checked against the twelve items, **then** all twelve pass, and a single failure means the screen is not done (`F7-43`). → proof, for item 2: D1's typecheck holds every built screen, and `qa-live` sees each one's loading, empty and failed state.

---

### T-SHELL-014 · Focus lands where the person goes next when a control removes itself — one helper, a required prop
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F7-23 (P0), F7-24 (P0)
**Design:** none — an engine task; it waits on no drawing and changes built screens.
**Why:** A screen-reader or keyboard user who presses *Try again*, *Undo*, *Remove* or *Dismiss* is left with focus on nothing, because the shared controls that leave have no way to say where focus goes; six private focus hooks and a dozen hand-written copies each answer it another way, per half.
**Depends on:** `T-M01-020` (its branch is built on the components this task changes).

**PRD rows (verbatim):**

- **F7-23** (P0, `docs/prd/foundations/F7-design-language.md`) — **The ten numbered interaction and accessibility rules are product law, carried unchanged.**
- **F7-24** (P0, `docs/prd/foundations/F7-design-language.md`) — **Focus is always visible, and it is never removed.**

**DONE WHEN:**
- **D1** · **Given** any screen, **when** it is audited against the ten rules, **then** it satisfies all ten, and any exception cited is `F7-10`'s overline and nothing else (`F7-23`). → proof, for N5: `RetryButton`, a failed card's retry, `Banner` and toast acts, `PendingAction` and every control that removes itself require a `focusAfter` target on one shared `.types.ts`, met by one focus helper in `packages/ui/src/primitives/` with a web and a phone half that replaces the private ones; a planted call without it fails `pnpm turbo typecheck`.
- **D2** · **Given** any interactive element on either platform, **when** it receives focus by keyboard or assistive technology, **then** a visible focus ring is present (`F7-24`). → proof: a component spec per control reads the focused element after the press and its ring; the phone's screen-reader focus by `qa-live`.

---

### T-SHELL-015 · One view model per screen pair, and a component's logic in its `.logic.ts` — both platforms draw from one assembly
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F7-30 (P0), F7-31 (P0)
**Design:** none — an engine task; it waits on no drawing and changes built screens.
**Why:** The web and the phone show the same screen differently — a company name read from two places, an act bar one platform never gets — because what both screens draw is assembled again in each screen file, and a component's web and phone halves each compute the same things (129 copies, 3,288 lines). Assembled once, the two cannot drift.
**Depends on:** `T-SHELL-013` (the view model hands the screens its `Read<T>` states) · `T-M01-020`.

**PRD rows (verbatim):**

- **F7-30** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 1 — mobile-first at 375 px, with full parity and no reduced edition.**
- **F7-31** (P0, `docs/prd/foundations/F7-design-language.md`) — **Principle 2 — parity is symmetric: the web experience stays full-featured and the mobile experience feels native and extremely fast.**

**DONE WHEN:**
- **D1** · **Given** any feature in any module, **when** its surfaces are listed, **then** both platforms carry it, the mobile design is the origin rather than the reduction, and the studio is included (`F7-30`, `F7-31`). → proof: every built screen pair draws from one `packages/domain` view model, filled by one `packages/data/src/react/` hook, that holds everything both screens draw — facts, words input, parts, overlay and leave state, the save and where its refusal goes — and each screen file holds markup and its platform adapters only; a dependency-cruiser or Biome rule refuses an assembly builder or local state in an `apps/web/features` or `apps/mobile/src/screens` file, seen red. A `packages/ui` component computes in its `.logic.ts` what both halves need, and `pnpm check:dupes`' web and phone threshold is lowered to what the lift leaves.

---

### T-SHELL-016 · No English inside `packages/ui` — every copy prop takes the `TranslatedText` brand
**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** F3-07 (P0)
**Design:** none — an engine task; it waits on no drawing and changes built screens.
**Why:** A Hindi or Marathi user hears and reads English where a component carries its own words — about 246 English defaults (`label = 'Sort'`) and 48 literal screen-reader labels — and new components copy the pattern because nothing refuses it. This is `docs/tasks/UI.md`'s English-string mechanism: it closes the rows *Hard-coded accessibility labels*, `Stepper`, `CoachMark`, `StatusChip`, `FieldOverride`, `SourceDocument` · `Dropzone`, `RichText` and `AllocationMeter`.
**Depends on:** `T-M01-020` (its branch is built on the components this task changes).

**PRD rows (verbatim):**

- **F3-07** (P0, `docs/prd/foundations/F3-localization.md`) — **Everything the product says is translated content.**

**DONE WHEN:**
- **D1** · Given any product-supplied user-visible string, when the language set is enumerated, then a translation exists for it in every language or `F3-05`'s fallback applies — and no string is designated permanently English-only (`F3-07`). → proof: `TranslatedText` is declared in `packages/contracts`, minted only by `packages/i18n`, and enrolled with its `brand-cast` plugin; every copy prop on a `packages/ui` `.types.ts`, and every `aria-label`, `accessibilityLabel`, `title` and `placeholder` there, takes it with no default; a planted literal, template literal and English default each fail `pnpm turbo typecheck`, and every caller passes catalog words.

---

### T-SHELL-001 · App Shell & Navigation — mobile
**Type:** screen · **Tier:** P0
**Status:** shipped (#209)
**Why:** A rep in a customer's living room reaches Add lead with one thumb and a surveyor reaches Start survey the same way, and every person lands on their own work with the company's name in the bar; without it each module invents its own navigation and the two-minutes-to-useful-work promise has nowhere to land. The phone is the flagship shell (`F7-22`'s pill footer), so it lands first; the desktop shell is `T-SHELL-008`.
**PRD rows:** F1-59 (P0), F7-22 (P0), F7-48 (P0), F7-50 (P0), M01-16 (P1), M01-17 (P0), M02-06 (P0), M13-10 (P0), MS12-19 (P0)
**BRIEF:** docs/ux/briefs/SCR-SHELL-01-app-shell.md
**DESIGN:** SCR-SHELL-01 → https://claude.ai/artifact/GmgFEzuBNQFfZBBMuPABoP

**Depends on:** `T-SHELL-011` (the bar, the switcher, the verb and the marks) · `T-SHELL-007` (shipped, #198) · `T-SHELL-009` (shipped, #199) · `T-M13-006` (shipped, #52) · `T-FPLAT-025` (shipped, #51) · `T-M01-025` (shipped, #40) · `T-M01-028` (shipped, #47) · `T-M01-001` (shipped, #53) · `packages/ui` `MobileTopBar`, `BottomNav`, `Fab`, `LogoTile`, `Menu`, `CoachMark`, `Block`, `EmptyState`, `Sheet`, `UnavailableNote` (landed).

**PRD rows (verbatim):**

- **F1-59** (P0, `docs/prd/foundations/F1-global-market-framework.md`) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.
- *Row removed 2026-08-07 by owner decision: `F4-22` (Surface 1 — the persistent global sync indicator) was deleted with the offline/sync capability. `docs/prd/foundations/F4-data-integrity.md` §5 forbids a global connection indicator, and the shell shows no connectivity state at all; the one surviving carve-out — field photographs held on the device — states its waiting count and retry on the capture screen (SCR-M04-07) and nowhere else (`F4-21`, `M04-55`).*
- **F7-22** (P0, `docs/prd/foundations/F7-design-language.md`) — **The mobile shell is a floating pill footer; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is one white pill floating over the page, above the home-indicator band (`F7-50`), holding the persona's few standing destinations and the primary add action. The destination in view is a **near-black pill — the primary-action colour, not a brand colour —** carrying its filled icon and its name; every other slot is an outlined icon whose name is its accessible label (`F7-26`). The add action sits in the pill's middle as a glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions. **The pill replaces the arc bar and its raised centre** (owner ruling 2026-09-29, mockup "A · Open page").
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M01-17** (P0, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank.
- **M02-06** (P0, `docs/prd/modules/M02-crm-and-leads.md`) — **Quick add is one tap from the primary add action on every surface.** On mobile it is the add action in the middle of the shell's pill footer; on web it is the primary action on the leads surface. The capture screen itself is a single screen with the duplicate check running live on the phone field as it is typed (M02-07).
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule: one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).
- **F7-48** (P0, `docs/prd/foundations/F7-design-language.md`) — **Each role's standing destinations follow its read grants, and the bar never offers a list the role cannot read.** The pill footer and the rail hold Home, at most two lists the role reads most often from its home, and More — never its home again, and never a module its `F2` grants give it no read on. By preset: EPC Owner — Leads · Projects; Sales Manager — Leads · Proposals; Sales Executive — Leads · Proposals; Survey Engineer — Leads; Design Engineer — Leads · Proposals; Project Manager — none; Field Technician — none; Installation Team Member — none; HR/Admin — People; Finance — Projects; Operations — Leads · Projects; Marketing — Campaigns · Leads. A person holding several presets takes the bar of the preset whose home is theirs (`M13-10`). The pill's add action carries only a verb the preset may perform: a Project Manager, who holds no add-lead grant and whose home names no act, has no add action, and the pill is Home · More alone (owner ruling 2026-09-27).
- **F7-50** (P0, `docs/prd/foundations/F7-design-language.md`) — **Every mobile screen keeps its content out of the device's safe areas.** No text, control or image is drawn under the camera cut-out or the status bar, and nothing interactive sits in the home-indicator band; the shell's navigation and any sticky action sit above it. The page's ground — and a screen's designed background, like the door's bloom — runs behind them edge to edge, as the platforms' own guidance asks. The insets are the device's, read at run time, never a fixed number. *(Owner ruling 2026-09-29; "content, not ground" ruled at `T-FPLAT-075`'s `/verify`, the reading the platforms' guidance takes.)*

**DONE WHEN:**
- **D1** · Given a breach event, when duties trigger, then the Data Protection Board and affected principals are notified and the grievance contact is published in-app (F1-59). → Q6 for the in-app contact's place, rendering the unauthored-key state while the pack's `dataRights` key is absent; the notification duty and the contact itself are proven at `T-FCORE-009`
- **D2** · **Given** the mobile application, **when** the shell renders for any persona, **then** the footer is one floating pill whose destination in view is the near-black pill with its name, and whose add action carries a fixed glyph and a role-appropriate verb (`F7-22`). → Q1, Q2; the resolution is unit-proven at `T-FPLAT-025`
- **D3** · Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16). → Q5; which marks show is `T-SHELL-011`'s D3
- **D4** · Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → Q1 — the home in force lands inside this shell, its region teaching until the module's home lands, never a generic dashboard or a blank; the atomic write is `T-M01-028`'s, and the name/photo and role-card screens are `T-M01-009`'s and `T-M01-010`'s — the invite path through them is driven there
- **D5** · Given any surface, when the primary add action is used, then quick add opens in one tap and the duplicate check runs live on the phone field (M02-06). → Q4; the capture screen and its live duplicate check are proven at `T-M02-001`
- **D6** · Given any combination of held presets, when the person signs in, then their home is the highest-ladder preset's home with every other held preset's today-block composed inside, and a switcher lists each held preset's home (M13-10). → Q3; the derivation is unit-proven at `T-M13-006` and `T-SHELL-011`
- **D7** · Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → Q7; the OTP, Google, language and units halves are proven at `T-M01-001` and `T-M01-011`, the photograph queue's at M04 (`M04-55`)
- **D8** · Given a member whose access is removed while the shell is open, then "your access was removed" shows gracefully, with no crash and no data loss on the device (`S1.wrong.4`, the brief's access-removed state). → Q8; `packages/domain/tests/auth/session-transitions.test.ts` › "holds a signed-in person whose access was removed, with the reason"
- **D9** · Three base states + brief-listed states present at 375px; zero raw colour literals/off-scale values. → Q1–Q8, Q10 at 375px on iOS, Q19 (the error frame) on Android; the iOS error frame is not driven — loading, empty (teaching), error, normal, role-adaptive-centre-action, single-preset-trivial, coach-marks-max-3-dismissible, access-removed-graceful; the availability settings land with `T-M07-027`, update-required with `T-SHELL-010`; parity with 1536px is proven at `T-SHELL-008`
- **D10** · **Given** a phone with a camera cut-out, **when** any screen renders, **then** no text, control or image is drawn under the cut-out or the status bar, the page's ground runs behind them, and nothing interactive sits in the home-indicator band (`F7-50`). → Q17, Q18 for the shell's top bar and pill
- **D11** · the shell's regression flow (`M152`): `scripts/gates.py`'s held list names `shell` in place of `home`, with qa-mobile driving it — no flow yet signs a seeded member in, and the sign-up flow cannot press Create company on iOS → `python3 scripts/gates.py` gate 33 passes with `shell` held, and fails with `home` still held once `screens/home/` is gone (proven red)

---

### T-SHELL-010 · Update required — the phone told plainly which version to get
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** A surveyor on an old build who opens the app after an api release sees a plain screen naming the version to install and a button to the store, instead of a door or a shell whose every call fails; without it the server's refusal (`T-FPLAT-033`) reaches the person as a bare error (`F4-36`).
**PRD rows:** F4-36 (P0)
**BRIEF:** docs/ux/briefs/SCR-SHELL-01-app-shell.md (the update-required bullet)
**DESIGN:** SCR-SHELL-01 → https://claude.ai/artifact/GmgFEzuBNQFfZBBMuPABoP — Frame 10 · update required
**Depends on:** `T-FPLAT-033` (shipped, #185 — the 426 refusal and `clientUpgradeRequiredSchema`) · `T-SHELL-001` (the shell it replaces).

**PRD rows (verbatim):**

- *Row removed 2026-08-07 by owner decision: `F4-22` (Surface 1 — the persistent global sync indicator) was deleted with the offline/sync capability. `docs/prd/foundations/F4-data-integrity.md` §5 forbids a global connection indicator, and the shell shows no connectivity state at all; the one surviving carve-out — field photographs held on the device — states its waiting count and retry on the capture screen (SCR-M04-07) and nowhere else (`F4-21`, `M04-55`).*

### T-SHELL-012 · The shell's parts, authored once — the home's head, its blocks, Frame 8 and the account menu leave the phone app
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** The web shell (`T-SHELL-008`) draws the same home head, teaching blocks, Frame 8 and account menu as the phone. Kept in `apps/mobile` they would be written twice and drift (`.claude/rules/screen-parts.md`). Split from `T-SHELL-008` at its `/start` (owner, 2026-10-02), so the phone's change ships and is checked on its own.
**PRD rows:** F1-59, M01-16, M13-10, MS12-19 — the rows the moved parts carry; their phone proofs are `T-SHELL-001`'s, run again here
**BRIEF:** docs/ux/briefs/SCR-SHELL-01-app-shell.md
**DESIGN:** SCR-SHELL-01 → https://claude.ai/artifact/GmgFEzuBNQFfZBBMuPABoP — its 375 frames, with `T-SHELL-001`'s DESIGN DIFFERENCES

**PRD rows (verbatim):**

- **F1-59** (P0, `docs/prd/foundations/F1-global-market-framework.md`) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule: one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**Depends on:** `T-SHELL-001` (shipped, #209 — the parts this moves) · `T-SHELL-010` (shipped, #211) · `T-SHELL-011` (shipped, #208).

### T-SHELL-008 · App Shell & Navigation — web
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** The owner, the managers and the studio work the desktop shell at a desk: the same person, company, home, switcher and menu as the phone, in a sidebar-and-header frame; without it every desktop screen would draw its own rail, and the phone and the desktop would drift apart on the one frame both share.
**PRD rows:** F1-59, F7-22, M01-16, M01-17, M13-10, MS12-19
**BRIEF:** docs/ux/briefs/SCR-SHELL-01-app-shell.md
**Design:** the same canvas as `T-SHELL-001`'s DESIGN line, its 1536 artboards — one screen, one register row (`SCR-SHELL-01`), one DESIGN line, kept on the first slice so the ledger stays whole (split by platform at the size signal).

**PRD rows (verbatim):**

- **F1-59** (P0, `docs/prd/foundations/F1-global-market-framework.md`) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.
- **F7-22** (P0, `docs/prd/foundations/F7-design-language.md`) — **The mobile shell is a floating pill footer; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is one white pill floating over the page, above the home-indicator band (`F7-50`), holding the persona's few standing destinations and the primary add action. The destination in view is a **near-black pill — the primary-action colour, not a brand colour —** carrying its filled icon and its name; every other slot is an outlined icon whose name is its accessible label (`F7-26`). The add action sits in the pill's middle as a glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions. **The pill replaces the arc bar and its raised centre** (owner ruling 2026-09-29, mockup "A · Open page").
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M01-17** (P0, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank.
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule: one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**Depends on:** `T-SHELL-012` (shipped, #214 — the parts both apps draw, split from this task at its `/start`) · `T-SHELL-007` · `T-SHELL-009` · `T-SHELL-001` (the phone shell it must match, state for state) · `T-M13-006` (PR #52) · `T-FPLAT-025` (shipped, #51) · `T-M01-025` (shipped, #40) · `T-M01-001` (shipped, #53 — the sign-in door on web) · `packages/ui` `AppShell`, `AppRail`, `AppHeader`, `TenantHeader`, `Menu`, `CoachMark`, `LogoTile`, `EmptyState` (landed).
### T-SHELL-002 · Global Search
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** An installer types a phone number from anywhere in the app and the caller's lead, site, proposal or project is one tap away — the phone is the CRM's identity; without it a rep scrolls lists to find who is calling, and a lead marked junk by mistake can never be found again.
**PRD rows:** F6-20, F6-23
**BRIEF:** docs/ux/briefs/SCR-SHELL-02-global-search.md
**DESIGN:** SCR-SHELL-02 → https://claude.ai/artifact/GmgFEzuBNQFfZBBMuPABoP

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
- Given a junk lead, when its phone number is searched by a user whose scope contains it, then it returns with its junk state visible; and given any list or queue, then it does not appear there (F6-23). → proof: QA web · ios · android search the junk lead's phone as a user whose scope holds it: the row carries the junk mark and a Reopen button in its trailing slot, and the lead inbox and every queue omit it; the scope filter is unit-proven at `T-FPLAT-020`
- (F6-20 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion.) → proof: QA web · ios · android one box in the web header and in the mobile shell; a city query returns rows in every matching entity group, each row a real link to its record; "quote" returns Proposals with every label reading Proposal
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web) every listed state at 1536px · QA (phone) every listed state at 375px

---

### T-SHELL-003 · Notification Center
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** A rep sees "proposal opened" and today's payment due in one bell on both devices and acts from the item itself; without it events reach nobody, the badge lies about what is unread, and the owner's monthly summary has nowhere to land.
**PRD rows:** F4-27, F6-07, F6-12, F6-17, F6-19, M13-21, M13-45
**BRIEF:** docs/ux/briefs/SCR-SHELL-03-notification-center.md
**DESIGN:** SCR-SHELL-03 → https://claude.ai/artifact/GmgFEzuBNQFfZBBMuPABoP

**PRD rows (verbatim):**

- **F4-27** (P0, `docs/prd/foundations/F4-data-integrity.md`) — **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation.
- **F6-07** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Read state travels up only and is set once** — reading on one device reads everywhere; nothing un-reads.
- **F6-12** (P1, `docs/prd/foundations/F6-notifications-and-search.md`) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
- **F6-17** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
- *Row removed 2026-08-07 by owner decision: `F6-18` (the centre works offline) was deleted with the offline/sync capability. Its cached-items and arrive-with-sync clauses died with the cache; its read-state clause survives verbatim at `F6-07` above, and its never-blocking clause at `F4-27` above — both now cited by this task in its own right.*
- **F6-19** (P2, `docs/prd/foundations/F6-notifications-and-search.md`) — **History is bounded and honest:** the centre keeps a practical horizon of items (with read state); the underlying facts live on their records' timelines forever — the centre is an inbox, not an archive, and says so at its horizon.
- **M13-21** (P1, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **If the owner never opens it, a short monthly summary is pushed in-app** — where they actually read things; the same fix as Agent performance's. The notification type registers with `foundations/F6`.
- **M13-45** (P1, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **A monthly agent summary is pushed in-app to the owner** — the nobody-opens-it fix, shared with M13-21's dashboard summary; the notification type registers with `foundations/F6`.

**Depends on:** `T-FPLAT-017` (the records, the registry, the badge's source of truth) · `T-FPLAT-018` (the type-groups the filter lists; the immediate class that never groups) · `T-FPLAT-019` (the list, the horizon, up-only read state) · `T-SHELL-001` (the bell in the shell) · `T-M01-025` (migration 0002 — the recipient's session) · `packages/ui` `Sheet`, `DetailPanel`, `Card`, `Banner` (landed).
**DONE WHEN:**
- Given unread notifications, when the badge renders on any device, then its count derives from the records and matches the list (F6-17). → proof: QA web · ios · android with three unread records the bell badge reads 3 at the foot of the web rail and in the mobile shell and equals the list's unread count; a push dropped in transit changes neither
- (F4-27, F6-07, F6-12, F6-19, M13-21 and M13-45 carry no dedicated Given/When/Then lines in their PRDs' acceptance blocks; the requirement texts above are the binding criteria — the centre marks read once and up-only per F6-07, and never stands a modal or spinner wall between the reader and their work per F4-27.) → proof: QA web · ios · android open an item on one device and it is read on the other and never un-reads; three proposal-opened events on one day render as one group with three reachable members; the horizon row says the centre is an inbox, not an archive; Mark all read is absent when nothing is unread and no modal or spinner wall stands between the reader and the list; the owner's monthly summary reads in place with the dashboard one control away
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-live every listed state at 1536px · qa-mobile every listed state at 375px

### T-SHELL-006 · Billing State Banner & Denial Sheets
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** An owner whose card failed keeps selling for seven days and is told on every screen exactly what paused and the one tap that fixes it; without it a blocked save is a silent failure and the team assumes the product is broken.
**PRD rows:** M12-06, M12-21, M12-30, M12-31, M12-39, M12-53
**BRIEF:** docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md
**DESIGN:** SCR-SHELL-06 → https://claude.ai/artifact/GmgFEzuBNQFfZBBMuPABoP

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
Domain types it reads (`packages/domain/src/commerce/`): `BILLING_STATES`, `BILLING_PHASES`, `STATE_CAPABILITY_MATRIX`, `capabilityStanding`, `isAlwaysOn`, `CAP_WARNING_PERCENT`, `CAP_GRACE_DAYS`, `TRIAL_DAYS`, `forfeitsPriceProtection`. It adds two beside them: the chip's prominence threshold (D-7) as a policy number next to `TRIAL_DAYS`, and the one-banner rule — state before cap, cap before bundle, so one act never draws two banners — as a pure function beside `soft-block.ts`; both names settled before the build (Law 11: the rule lands before either platform renders it).
**Depends on:** `T-M12-005` (the machine and its read) · `T-M12-008` (entitlements) · `T-M12-009` (the gates and the typed denial's details) · `T-M12-010` (the cap rollups) · `T-M12-011` (the ladder's rungs and their copy) · `T-M12-013` (the protection-horizon fact behind the forfeiture sentence) · `T-M12-002` (Reactivate) · `T-M12-003` (the plan-pick destination) · `T-SHELL-001` (the shell that hosts the banner and the chip) · `T-M01-025` (migration 0002) · the M12 migration numbers those tasks declare when their slice begins (Law 9) · `packages/ui` `Banner`, `Sheet` (landed).
**Out of scope:** the machine, the timers, the gates, the rollups and the rung copy — `T-M12-005`, `T-M12-009`, `T-M12-010`, `T-M12-011`; the usage screen and its 80% pre-warning — `T-M12-004`; the plan-pick screen — `T-M12-003`; Billing Home and reactivation — `T-M12-002`; the push and SMS rungs — `T-M12-011` over `T-FPLAT-018`; the shell frame — `T-SHELL-001`.
**DONE WHEN:**
- Given a charge failure, when days 0–3 elapse, then everything works with a banner; when day 4 arrives, then exactly the metered features pause; when day 7 passes unpaid, then the state is `halted` with the matrix's always-on rows intact (M12-06). → proof: QA web · ios · android advance a `past_due` tenant through `T-M12-005`'s machine: days 0–3 the banner alone with every surface working; day 4 the banner names voice, AI detections and invites as paused and nothing else; day 7 the halted banner lists the four always-on items and read, export, customer links and the billing screens still work
- Given any state in the matrix and any capability row, when M12's enforcement is audited row by row, then no ✓ has become a block and no block has widened (M12-21, M12-22). → proof: QA web · ios · android attempt each gated mutation in each of the six states and read the denial sheet against `STATE_CAPABILITY_MATRIX`: every ✓ acts, every block is refused at the attempt with the Reactivate or upgrade route, and nothing is greyed out beforehand; the matrix itself is unit-proven in `packages/domain/tests/commerce/soft-block.test.ts`
- Given a cap reaching 80%, when the usage screen renders, then the pre-warning is present before any gate has fired (M12-30, M12-34). → proof: QA (web) at 80% of a cap the shell draws no banner and no gate has fired; at 100% the cap banner names the type and the grace end; after grace a new creation of that type is refused with the upgrade-or-next-cycle note while editing existing records still works; the usage screen's pre-warning is proven at `T-M12-004`
- Given a first failed charge, when the ladder runs unpaid to day 7, then each rung fires with its stated content, day 4's message names the paused set exactly, and day 7's confirms what still works (M12-39, M12-41). → proof: QA web · ios · android run `T-M12-011`'s ladder unpaid to day 7 on an ordinary and a protected tenant: each rung's banner carries its content, day 4 names the paused set exactly, day 7 confirms the four still-working items, and only the protected tenant's banners carry the forfeiture sentence from day 0
- Given trial expiry, when it lands, then the state is `expired`, the plan-pick screen is the path forward, and read + export + links keep working (M12-53). → proof: QA web · ios · android a trialing tenant at D-8 shows the subtle chip and at D-7 the prominent one; at expiry the banner says the trial has expired, a blocked create shows the plan prompt routing to Plan Selection, and read, export and customer links still work
- (M12-31 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — its message content is exercised by M12-39's line, "day 4's message names the paused set exactly".) → proof: QA (web) read every pause message in each launch language: each names what paused, until when and what resolves it, and no "account limited" string exists in `packages/i18n`
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web) every listed state at 1536px · QA (phone) every listed state at 375px

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
