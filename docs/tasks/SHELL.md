# Tasks — SHELL (app shell & platform surfaces)

Task-id prefix: `T-SHELL-`. One screen task per shell screen. Rules per `docs/tasks/README.md`:
acceptance criteria are copied verbatim from the PRD, never rewritten; `DESIGN: PENDING`
blocks build, not start. Briefs live in `docs/ux/briefs/`.

---

## T-SHELL-001 · App Shell & Navigation

```
Type: screen
Tier: P0
PRD:    F1-59, F7-22, M01-16, M01-17, M02-06, M07-46, M13-10, MS12-19
BRIEF:  docs/ux/briefs/SCR-SHELL-01-app-shell.md
DESIGN: SCR-SHELL-01 → PENDING
```

**PRD rows (verbatim):**

- **F1-59** (P0, `docs/prd/foundations/F1-global-market-framework.md`) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app.
- *Row removed 2026-08-07 by owner decision: `F4-22` (Surface 1 — the persistent global sync indicator) was deleted with the offline/sync capability. `docs/prd/foundations/F4-data-integrity.md` §5 forbids a global connection indicator, and the shell shows no connectivity state at all; the one surviving carve-out — field photographs held on the device — states its waiting count and retry on the capture screen (SCR-M04-07) and nowhere else (`F4-21`, `M04-55`).*
- **F7-22** (P0, `docs/prd/foundations/F7-design-language.md`) — **The mobile shell is an arc bar with an elevated centre action; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is an arc with a raised centre action that is **near-black — the primary-action colour, not a brand colour** — carrying an ink glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). The surrounding slots are the persona's few standing destinations. Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions.
- **M01-16** (P1, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M01-17** (P0, `docs/prd/modules/M01-onboarding-and-tenant-config.md`) — **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank.
- **M02-06** (P0, `docs/prd/modules/M02-crm-and-leads.md`) — **Quick add is one tap from the primary add action on every surface.** On mobile it is the shell's elevated centre action; on web it is the primary action on the leads surface. The capture screen itself is a single screen with the duplicate check running live on the phone field as it is typed (M02-07).
- **M07-46** (P0, `docs/prd/modules/M07-sales-execution.md`) — **Per-user routing availability is a manual toggle in v1**: available · busy · off, with an optional until-time. Ring groups and chains read it.
- **M13-10** (P0, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **The composition rule (resolves register `Q5` / F2 `F2-Q1`): one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
- **MS12-19** (P0, `docs/prd/modules/M05-studio/11-shell-and-platform.md`) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding).

**DONE WHEN** (the requirement rows' own Given/When/Then, copied verbatim):

- Given a breach event, when duties trigger, then the Data Protection Board and affected principals are notified and the grievance contact is published in-app (F1-59).
- **Given** the mobile application, **when** the shell renders for any persona, **then** the arc centre is the near-black primary action with a fixed glyph and a role-appropriate verb (`F7-22`).
- Given a first-run landing, when coach marks render, then there are at most three, on that screen, each dismissible, and no carousel exists (M01-16).
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17).
- Given any surface, when the primary add action is used, then quick add opens in one tap and the duplicate check runs live on the phone field (M02-06).
- Given a user sets themself off until 3 pm, when routing runs, then they are skipped until then (M07-46).
- Given any combination of held presets, when the person signs in, then their home is the highest-ladder preset's home with every other held preset's today-block composed inside, and a switcher lists each held preset's home (M13-10).
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

## T-SHELL-002 · Global Search

```
Type: screen
Tier: P0
PRD:    F6-20, F6-23
BRIEF:  docs/ux/briefs/SCR-SHELL-02-global-search.md
DESIGN: SCR-SHELL-02 → PENDING
```

**PRD rows (verbatim):**

- **F6-20** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)*
- **F6-23** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake.

**DONE WHEN** (the requirement rows' own Given/When/Then, copied verbatim):

- Given a junk lead, when its phone number is searched by a user whose scope contains it, then it returns with its junk state visible; and given any list or queue, then it does not appear there (F6-23).
- (F6-20 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text above is the binding criterion.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

## T-SHELL-003 · Notification Center

```
Type: screen
Tier: P0
PRD:    F4-27, F6-07, F6-12, F6-17, F6-19, M13-21, M13-45
BRIEF:  docs/ux/briefs/SCR-SHELL-03-notification-center.md
DESIGN: SCR-SHELL-03 → PENDING
```

**PRD rows (verbatim):**

- **F4-27** (P0, `docs/prd/foundations/F4-data-integrity.md`) — **A warning never disables a primary action.** No modal and no spinner wall stands between a user and their work, and no primary action is pre-emptively greyed out. Where an action genuinely cannot be performed, it is refused honestly **at the attempt**, with a reason, rather than disabled with no explanation.
- **F6-07** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **Read state travels up only and is set once** — reading on one device reads everywhere; nothing un-reads.
- **F6-12** (P1, `docs/prd/foundations/F6-notifications-and-search.md`) — **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06).
- **F6-17** (P0, `docs/prd/foundations/F6-notifications-and-search.md`) — **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02).
- *Row removed 2026-08-07 by owner decision: `F6-18` (the centre works offline) was deleted with the offline/sync capability. Its cached-items and arrive-with-sync clauses died with the cache; its read-state clause survives verbatim at `F6-07` above, and its never-blocking clause at `F4-27` above — both now cited by this task in its own right.*
- **F6-19** (P2, `docs/prd/foundations/F6-notifications-and-search.md`) — **History is bounded and honest:** the centre keeps a practical horizon of items (with read state); the underlying facts live on their records' timelines forever — the centre is an inbox, not an archive, and says so at its horizon.
- **M13-21** (P1, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **If the owner never opens it, a short monthly summary is pushed in-app** — where they actually read things; the same fix as Agent performance's. The notification type registers with `foundations/F6`.
- **M13-45** (P1, `docs/prd/modules/M13-dashboards-and-reporting.md`) — **A monthly agent summary is pushed in-app to the owner** — the nobody-opens-it fix, shared with M13-21's dashboard summary; the notification type registers with `foundations/F6`.

**DONE WHEN** (the requirement rows' own Given/When/Then, copied verbatim):

- Given unread notifications, when the badge renders on any device, then its count derives from the records and matches the list (F6-17).
- (F4-27, F6-07, F6-12, F6-19, M13-21 and M13-45 carry no dedicated Given/When/Then lines in their PRDs' acceptance blocks; the requirement texts above are the binding criteria — the centre marks read once and up-only per F6-07, and never stands a modal or spinner wall between the reader and their work per F4-27.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

## T-SHELL-006 · Billing State Banner & Denial Sheets

```
Type: screen
Tier: P0
PRD:    M12-06, M12-21, M12-30, M12-31, M12-39, M12-53
BRIEF:  docs/ux/briefs/SCR-SHELL-06-billing-state-banner.md
DESIGN: SCR-SHELL-06 → PENDING
```

**PRD rows (verbatim):**

- **M12-06** (P0, `docs/prd/modules/M12-platform-billing.md`) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7.
- **M12-21** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law.
- **M12-30** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting.
- **M12-31** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited".
- **M12-39** (P0, `docs/prd/modules/M12-platform-billing.md`) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04, Q43):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it.
- **M12-53** (P0, `docs/prd/modules/M12-platform-billing.md`) — **Trial UX: honest countdown, soft expiry, no hostage patterns.** A countdown chip stays subtle until D-7; expiry leads to a plan-pick screen; post-expiry is the soft-block set — create/edit paths blocked with a plan prompt, read + export always working. Expiry must convert, never destroy.

**DONE WHEN** (the requirement rows' own Given/When/Then, copied verbatim):

- Given a charge failure, when days 0–3 elapse, then everything works with a banner; when day 4 arrives, then exactly the metered features pause; when day 7 passes unpaid, then the state is `halted` with the matrix's always-on rows intact (M12-06).
- Given any state in the matrix and any capability row, when M12's enforcement is audited row by row, then no ✓ has become a block and no block has widened (M12-21, M12-22).
- Given a cap reaching 80%, when the usage screen renders, then the pre-warning is present before any gate has fired (M12-30, M12-34).
- Given a first failed charge, when the ladder runs unpaid to day 7, then each rung fires with its stated content, day 4's message names the paused set exactly, and day 7's confirms what still works (M12-39, M12-41).
- Given trial expiry, when it lands, then the state is `expired`, the plan-pick screen is the path forward, and read + export + links keep working (M12-53).
- (M12-31 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion — its message content is exercised by M12-39's line, "day 4's message names the paused set exactly".)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

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
