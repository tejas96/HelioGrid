# SCR-SHELL-01 · App Shell & Navigation

The permanent frame of the product: mobile arc bar with a raised centre action in the near-black primary-action role (not a brand colour), carrying a role-adaptive verb; desktop sidebar-and-header shell.

**Module:** SHELL · **Personas:** All tenant users — every operator, sales, studio, field and employee persona (Sales Executive, Sales Manager, EPC Owner, Survey Engineer, Field Technician, Installation Team Member, and all others) · **Context of use:** the shell is present on every screen on both platforms. Field personas use it on a phone held in one hand outdoors; sales personas arrive "phone, almost always" — in a customer's living room, in a car, on a call, rarely at a desk; owner, manager and studio personas also work the desktop sidebar-and-header shell at a desk.

## Entry & exit

Reached from: first-run onboarding ends **on** the role-decided home inside this shell, never on a generic dashboard (M01-17); thereafter the shell is the permanent chrome around every screen. Leads to: the role home chosen by the preset-precedence ladder, with a switcher listing the home of every held preset (M13-10); one-tap quick add from the elevated centre action (M02-06 → SCR-M02-01); the shell also hosts the global search box (SCR-SHELL-02) and the notification bell (SCR-SHELL-03). Placement of the availability toggle (M07-46), the grievance contact (F1-59) and the sign-out control (MS12-19) within the shell: not pinned by PRD — designer decides, note the decision.

**Decisions made in design (2026-08-19) — the brief left these open; the next screen inherits them.**

1. **Availability (M07-46)** — a `StatusChip` pill in the home header stating the until-time inline ("Busy until 17:00") with the recording line beside it ("You set this at 12:40 — ring groups see it"). It opens the Routing availability editor: `OptionCardGroup` (available · busy · off) plus `TimeField` "Until (optional)", `min 09:00` / `max 21:00`, `windowName` "team calling" — a time outside the window is refused with the window named, never clamped.
2. **Grievance contact (F1-59) and sign-out (MS12-19)** — behind the top-bar avatar, in a two-item `Menu`. Sign-out is not styled destructive: MS12-19 preserves work, so N8's confirm-and-undo has no subject.
3. **Tenant identity** — the tenant's name as words beside the product `LogoTile`. No monogram, no tenant logo, no tenant colour anywhere in the shell (F7-07).
4. **Home switcher (M13-10)** — the home title *is* the switcher: `Menu selection="single"`, `menuitemradio` + tick, listing the home of every held preset. Switching swaps which body of work is the home's own and which is composed in.
5. **Fourth standing destination = Quotes** (Home · Leads · Quotes · More). Visits are composed inline in My Day and need no second route.
6. **The centre action's verb follows the home in force** ("Add lead" on My Day, "Start survey" on Today's surveys); the four standing destinations belong to the person and do not change with the home. The plus glyph never changes (F7-22).
7. **Section frames go flat only where the child renders as cards** — the phone's `RecordCard` work lists and the `StatCard` figures block at both widths. A desktop work block holds `ListRow` glance rows, so it keeps its frame. The working `DataTable` and its F7-27 caption belong to the full list behind "See all", not to this screen.
8. **The shell bar carries shell things; the home header is the first band of the content region**, at both widths. `AppHeader` holds tenant, search, bell and avatar — no page title. Title-switcher, preset line, availability pill, its recording line and the primary action sit together in the content.
9. **The home stays a dashboard at 1536**, two columns instead of one — never a data table. Density is chosen by surface (F7-17).

**Clock:** times render in the market pack's clock — the India pack is 24-hour, so the pill reads `17:00`, not "5:00 PM" (`F1` / `F3-20`). Storage stays 24-hour.


## Requirements (verbatim)

### docs/prd/foundations/F1-global-market-framework.md

- **F1-59** (P0) — **IN breach duty:** notify the Data Protection Board and affected data principals; a grievance contact is published in-app. _(non-UI half, build-side: breach-notification duty to Data Protection Board and affected principals — for awareness, not for drawing)_


### docs/prd/foundations/F7-design-language.md

- **F7-22** (P0) — **The mobile shell is an arc bar with an elevated centre action; the desktop shell is a sidebar.** Mobile navigation is not a flat tab rectangle: it is an arc with a raised centre action that is **near-black — the primary-action colour, not a brand colour** — carrying an ink glyph that never changes per screen, while the **verb it performs adapts to the person's role** (a sales persona adds a lead; a surveyor starts a survey). The surrounding slots are the persona's few standing destinations. Desktop uses the sidebar-and-header shell. Both shells are part of the design system rather than per-module inventions. _(non-UI half, build-side: centre-verb resolution reads role presets (F2-01); composition rule for multi-preset users deferred to M13 — for awareness, not for drawing)_

### docs/prd/modules/M01-onboarding-and-tenant-config.md

- **M01-16** (P1) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
- **M01-17** (P0) — **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank. _(non-UI half, build-side: handoff law: onboarding ends on the role-decided home with real assigned work, never a generic dashboard — for awareness, not for drawing)_

### docs/prd/modules/M02-crm-and-leads.md

- **M02-06** (P0) — **Quick add is one tap from the primary add action on every surface.** On mobile it is the shell's elevated centre action; on web it is the primary action on the leads surface. The capture screen itself is a single screen with the duplicate check running live on the phone field as it is typed (M02-07).

### docs/prd/modules/M07-sales-execution.md

- **M07-46** (P0) — **Per-user routing availability is a manual toggle in v1**: available · busy · off, with an optional until-time. Ring groups and chains read it.

### docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-10** (P0) — **The composition rule (resolves register `Q5` / F2 `F2-Q1`): one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration. _(non-UI half, build-side: fixed preset-precedence ladder derives one home; other presets compose as blocks; ladder is product constant — for awareness, not for drawing)_

### docs/prd/modules/M05-studio/11-shell-and-platform.md

- **MS12-19** (P0) — Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding). _(non-UI half, build-side: sign-out clears session state without destroying work — for awareness, not for drawing)_
- **F4-36** (P0) — **A client too old to talk to the server is told so plainly, and told which version to get.** The product ships client versions and will break API compatibility; when a client is below the minimum supported version the server declares, the app shows a plain forced-upgrade screen that **names the required version and routes to the store**, in place of the surface the person asked for. It is never a bare error, never a silent failure, and never a screen that pretends to work. There is nothing to fall back to: v1 keeps no local store (§5), so an out-of-date client has no cached data being withheld from anyone — which is why the rule is a screen and not a degraded read mode. The minimum supported version is server-declared, so raising it never requires a client release.
  _Constraint on this row — F7-07 (P0, `docs/prd/foundations/F7-design-language.md`; the row itself is dispositioned to SCR-M01-18): "**Tenant branding applies to customer-facing documents and link pages only; the operator application is never restyled per tenant.** … There is no tenant stylesheet, no theme upload and no per-tenant palette anywhere in the web or mobile application." So the tenant identity in this top bar is the tenant's **name** — the tenant's logo and the tenant's brand colour never reach the shell, on either platform, in any state. The "M01 branding" pointer names where a tenant configures a logo and a brand colour (M01-50), and those ride the generated proposal document and the tokenised customer-link pages, not this application. The brand that appears in the top bar is the product's own, never the tenant's (F7-05's no-invented-mark law)._

## States

Three base states, then every screen-specific state from the slice and the rows. **Nine distinct
frames** — draw each once, and the nine bullets below are exactly those nine. *(History, and it
does not fully reconcile: the pre-flight pass of 2026-08-07 de-duplicated a list of sixteen
bullets in which four restated another bullet under a second name, and recorded the result as
"ten frames"; the offline removal of the same day then cut two more. Nine is the count that
matches the list you are reading — it was verified by counting the bullets on 2026-08-16 — and
the intermediate figures are left as written rather than retro-fitted into an arithmetic that
never quite worked.)*

- **loading**
- **empty** — teaching empty: a role home with nothing assigned yet says what will appear here and who to ask, never a blank screen (M01 edge `S1.wrong.3` via M01-17's handoff). *(Absorbs the former `teaching-empty` bullet, which restated this one.)*
- **error**
- **normal** — signed-in shell with real work present, which is also the first-run landing showing the work already assigned (M01-17). *(Absorbs the former `real-work-present` bullet — same frame, first-run reading.)*
- **role-adaptive-centre-action** — the elevated centre action: its verb changes per the signed-in person's role (F7-22) and it is the one-tap quick-add entry (M02-06). *(Merges the former `role-adaptive-verb-per-persona` and `centre-add-action` bullets — one button, two requirements on it. Show the verb at more than one role so the adaptivity is visible.)*
- **single-preset-trivial** — one held preset: the ladder is trivial, home is that preset's, switcher lists one (M13-10)
- **coach-marks-max-3-dismissible** — at most three coach marks, on the screen actually landed on, each dismissible, never a carousel (M01-16). The design system ships `CoachMark` / `CoachMarkSequence` for this — do not invent one.
- **access-removed-graceful** — "your access was removed" shown gracefully, no crash, no data loss on device (M01 edge `S1.wrong.4`)
- **available** / **busy** / **off-until-time** — the manual routing-availability toggle's three values, with the optional until-time (M07-46). One frame with three settings, not three frames.
- **update-required** — the client is below the server-declared minimum version: a plain full-screen block that NAMES the required version and routes to the store, in place of the surface asked for. Never a bare error and never a screen pretending to work; there is no cached data being withheld, because v1 keeps no local store (F4-36).
  - *Component note (superseded 2026-08-18):* this bullet used to say the system shipped no time picker and told you to compose one from a `Select` of half-hour slots. **That is no longer true and must not be followed.** The system ships **`TimeField`**, built for exactly this row — and it does more than take a time: a value outside `min`/`max` is **refused with the window named, never clamped**, which is the pattern the calling-window screens (`SCR-M07-05`, `SCR-M07-06`) depend on and which money entry later copied. Use it. `TimeRangeField` is its two-ended form. Do **not** invent a slot picker, and do not write a chosen pattern into this bullet — the pattern is the component.

The shell looks the same for every tenant: the operator application is never restyled per tenant — there is no tenant stylesheet, no theme upload and no per-tenant palette anywhere in the web or mobile application, so no state above has a tenant-branded variant. Tenant branding lives on customer-facing documents and link pages; here the tenant appears by name (F7-07, MS12-19).

## Data volume

Design the switcher at multiple held presets — the PRD's own worked examples are a rep + surveyor, and a Field Technician + Survey Engineer + Installation Team Member holding three homes (M13-10); arc-bar slots hold only "the persona's few standing destinations" (F7-22); coach marks cap at three (M01-16).

## Numbers carrying provenance

- The optional until-time on the availability toggle (M07-46) — **a recorded value, so NO tier.**
  The user set it; nothing computed or estimated it. *(Amended 2026-08-07 by the `Q59` refinement:
  this line briefly said the until-time carried a tier, under the first form of the ruling that
  tested "has it happened yet". The test is now how the value was arrived at — recorded, or
  computed/guessed — and a value a person typed is recorded.)*

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried the global sync indicator (`F4-22`), an `offline` state and an `all-synced-quiet` state, and its entry/exit pointed at `SCR-SHELL-04` (Sync Center), which no longer exists. All four are deleted, not deprecated. The shell no longer shows connectivity at all; losing the connection is handled by one shared offline screen, not by a state on this or any other surface.*
