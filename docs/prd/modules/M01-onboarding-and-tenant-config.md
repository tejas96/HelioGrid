# M01 · Onboarding & tenant configuration

Status: draft · Origin mix: SRC/BRIEF (this document carries no `REC` items) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md`, `foundations/F1-global-market-framework.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F3-localization.md`,
`foundations/F4-data-integrity.md`, `foundations/F7-design-language.md`,
`foundations/F8-data-honesty.md`, *retired: PRD design note* §2 (DD8–DD12), §9–§10

## 1. Purpose & scope

This module is the front door and the configuration surface of the product: how a company
becomes a tenant (self-serve signup), how its people become users (phone-keyed invites and
first-run onboarding), and everything an EPC can make their own. The source's framing is
carried whole: *"Every company on the platform is different: different brands, different
warranties, different pitch, different service area. **Configuration is a first-class product
surface, not a settings dumping ground**"* (`TC.principle.1`), and the onboarding conviction
that shapes every screen here: ask for **the minimum to produce one real proposal**, and
collect the rest when it is actually needed (`S0.rule.minimum-first`).

The module owns, as feature areas: company signup and authentication · team invites, user
onboarding and the role-administration screens · progressive setup, the business profile and
the demo project · **the catalog** (the two-tier model in full — this is the module's largest
area) · the price book · branding and document templates · payment-term (tranche) templates ·
message templates · the agent & voice configuration *surface list* (detail in
`modules/M07-sales-execution.md`) · capture settings, locale defaults and integration
credentials.

**What this module is explicitly not.**

- It does **not** define roles, permissions or matrices — `foundations/F2-roles-and-permissions.md`
  is the permission truth; this module renders F2's semantics on its Team / Assign roles /
  Roles reference / Invite screens and never restates a matrix (F2-25).
- It does **not** carry the voice agent's behaviour, knowledge-base mechanics, compliance-gate
  mechanism, telephony or number-provisioning flows — those are
  `modules/M07-sales-execution.md`'s. M01 owns only the fact that these surfaces exist in
  tenant configuration, and their governing principle (§M01.9).
- It does **not** own platform billing: signup contains no plan or payment step (M01-11);
  subscription lifecycle, trial and entitlements are `modules/M12-platform-billing.md` and
  `04-business-model.md`.
- It does **not** define the component-picker UX. The shared picker pattern (accordion
  sections, three entry paths, badges — design spec §2 DD12, §10) is specified where it is
  used, in `modules/M05-design-studio.md` / `modules/M06-proposals.md`; M01 specifies the
  **catalog side**: the data model behaviours, search, certification-badge data, and the
  self-serve add flows the picker invokes.
- It carries no market facts as constants: tax registration formats, certification schemes,
  demo content, holiday calendars and phone specifications are all market-pack data referenced
  through F1's pack keys (F1-02).
- No implementation content: no schemas, APIs or storage design (design spec §14/DD4). Where
  source rows name tables or enums, this document carries the product law and drops the
  mechanism.

## 2. Personas & surfaces

All twelve personas of `02-personas.md` pass through this module — every one of them signs in,
accepts an invite, and lands on a role-decided first screen. The module's *administering*
personas are narrower:

- **EPC Owner** — the module's primary persona: signs the company up ("usually on a laptop,
  often with a salesperson on a call" — `S0.rule.minimum-first`), invites the team, and owns
  every tenant-configuration surface. Team and role administration is EPC Owner-only
  (`F2.M01.manage-team`); tenant settings are EPC Owner-only (`F2.M01.manage-tenant-settings`).
- **Operations** — manages the catalog and publishes price-book versions with the EPC Owner
  (design spec §2 DD11; `F2.M01.manage-catalog`).
- **Finance** — views catalog prices and margins; never administers (DD11).
- **Sales Manager · Sales Executive · Design Engineer** — meet the catalog through the picker
  and through inline self-serve add while quoting or designing (`F2.M01.add-own-catalog-items`).
- **Every employee persona** — the invited-user onboarding of §M01.2 (invite → OTP → profile →
  role explained → role home). The source is explicit about their device: "Phone, almost
  always" (`S1.happy`).

**Surfaces.** Web and mobile carry every capability equally (D2; `OV-08`), on both mobile
platforms from day one (the OD-3 surface commitment). Emphasis per feature: signup and company
onboarding are laptop-leaning but fully mobile-capable; invited-user onboarding is
mobile-first; the settings suite and catalog administration are web-emphasis (dense lists,
import wizards are desktop-first per the UXG-01 pattern), with one-tap acts — invite,
deactivate, archive, toggle — first-class on mobile; inline catalog add works on both surfaces
at the point of need.

*Section removed 2026-08-07 by owner decision: the offline/sync capability was deleted.*

## 3. Feature areas

### M01.1 — Company signup & authentication

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-01 | **Self-serve signup, minimal fields.** A company signs itself up: phone number → OTP; then company name, the owner's name, and city. **Nothing else** — no tax registration, no logo, no price book, no team, no payment instrument. The person signing up becomes the tenant's first EPC Owner. | `SRC` — `D11` ("Self-serve signup", the live half post-overlay; *retired: D-census ledger*); `S0.screen.1` ("Phone number → OTP. Company name, your name, city. Nothing else.") | P0 |
| M01-02 | **Google Login is supported alongside Mobile OTP — as a convenience sign-in bound to the SAME phone-identity account (owner ruling 2026-08-04, Q18).** Both sign-in methods exist on web and mobile; the account identity remains the phone number (M01-18), and a Google identity is **linked** to that phone-identified account at the **first Google sign-in** via the linking flow — never creating a duplicate account, and never standing in for the verified phone. A brand-new signup completes phone verification as part of becoming an account; Google is the convenience door onto it. Architecture stays future-friendly for further methods. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Authentication ("Support Mobile OTP, Google Login. Future-friendly architecture.") · phone-as-identity grounding at `DOC04.user-lifecycle`; linking rule per owner ruling 2026-08-04 (Q18) | P0 |
| M01-03 | **OTP delivery is SMS-only and never silently degrades — the system uses no fallback mechanism (owner ruling 2026-08-06, Q47).** SMS is the delivery channel, and nothing is retried behind the user's back. The user gets a visible **resend** control, which unlocks at 30 s (M01-04, owner ruling 2026-08-06 Q44), and, if the code still does not arrive, a **"call me instead"** voice-OTP option — **retained as a USER-initiated option, not a system fallback**: the ruling names what "the system should not use", and a user whose SMS path is broken must still have a way in. If delivery fails, login fails loudly with a plain retry-later message — "No silent degradation on the front door," a principle this ruling **strengthens rather than weakens**, because nothing now happens invisibly at all. **When the SMS rail confirms a HARD delivery failure, that loud-failure state releases the resend cooldown immediately and offers the "call me instead" voice OTP in the same state (owner ruling 2026-08-06, Q51)** — the cooldown exists to stop resends while a message is still in flight, and once the network confirms failure nothing is in flight, so the user may act at once. What is released is the cooldown and nothing else: **`M01-04`'s anti-abuse caps are UNCHANGED and still bind** (3 requests per 15 min, 8 per day per phone, 5 failed verifies invalidate the OTP, 3 invalidations lock the number for 15 min) — where a cap is already reached the cap still governs and the honest message says so. *(This row previously read "**OTP delivery is layered and never silently degrades.** SMS is the primary channel, with automatic fallback to a secondary messaging-channel OTP where the market's OTP rail provides one, on delivery failure or a 30 s timeout. The user additionally gets a visible **resend** control and, if the code still does not arrive, a **“call me instead”** voice-OTP option. If every channel fails, login fails loudly with a plain retry-later message — “No silent degradation on the front door.”" — the automatic secondary-channel fallback clause is removed by this ruling; owner's words: "keep only resend feature after 30s that button get enabled, and the system should not use any fallback mechanism.")* *(This row previously stated nothing about the resend control inside that loud-failure state, and nothing about whether the voice OTP was offered there — the silence the Q47 closure pass recorded as M01 §6's open 0–30 s hard-failure question; owner ruling 2026-08-06 (Q51) supplies it and changes nothing else in this row.)* | `SRC` — `DOC07.otp-delivery` (docs/engineering/07; *retired: docs-rules ledger*) — **its automatic-fallback half is SUPERSEDED by owner ruling 2026-08-06 (Q47)**; the citation is kept, not deleted, and the row's surviving halves (SMS delivery, loud failure, no silent degradation) still rest on it; `S0.wrong.2` ("resend after 30s, then offer 'call me instead'") · the OTP rail is a vendor-neutral capability with the v1 reference implementation recorded in F1 (`F1-43`, `F1-49`) · the confirmed-hard-failure state's immediate resend-cooldown release and its in-state voice-OTP offer are added by owner ruling 2026-08-06 (Q51); no `M01-04` cap is touched by it | P0 |
| M01-04 | **OTP anti-abuse limits are product-visible.** Requests are capped (3 per 15 min and 8 per day per phone); resend has a cooldown; 5 failed verify attempts invalidate the OTP; 3 consecutive invalidations lock the phone number for 15 min with an honest message; invite sends are capped per tenant per day. **The resend cooldown is 30 seconds (owner ruling 2026-08-06, Q44)** — the value the journey already promises the user ("resend after 30 s", `S0.wrong.2`); docs/engineering/08's 45 s resend cooldown is **superseded**, and the UI resend control respects the ruled 30 s. Every other limit in this row is unchanged by the ruling. **`M01-03`'s delivery path is no longer layered (owner ruling 2026-08-06, Q47)** — its automatic secondary-channel fallback is removed, leaving SMS delivery plus this row's **resend** control and the user-initiated **“call me instead”** voice OTP; that sentence previously read “as is `M01-03`'s layered delivery path (SMS → fallback channel → voice OTP)”. **The cooldown is released immediately when the SMS rail confirms a HARD delivery failure (owner ruling 2026-08-06, Q51)** — the cooldown exists to stop resends while a message is still in flight, and once the network confirms failure nothing is in flight, so in `M01-03`'s loud-failure state the resend control is available at once and the user-initiated **“call me instead”** voice OTP is offered in that same state. **What is released is the cooldown alone: every cap in this row is UNCHANGED and still binds** — 3 requests per 15 min, 8 per day per phone, 5 failed verifies invalidate the OTP, 3 invalidations lock the number for 15 min — so where a cap is already reached the cap still governs and the honest message says so; the ruled 30 s continues to govern the ordinary in-flight case. *(This row previously read "**Recorded, not resolved:** the journey offers resend “after 30 s” (`S0.wrong.2`) while docs/engineering/08 sets a 45 s resend cooldown — the UI resend control must respect whichever cooldown is ruled; the divergence is carried in both source rows and recorded at `registers/conflicts.md` row 9." — that divergence, `registers/conflicts.md` row 9, is closed by this ruling.)* *(The cooldown's behaviour inside a confirmed hard-failure state was previously unstated in this row — the gap the Q47 closure pass recorded as M01 §6's open 0–30 s hard-failure question; owner ruling 2026-08-06 (Q51) supplies it and amends no limit here.)* | `SRC` — `DOC08.otp-limits` (docs/engineering/08); the `S0.wrong.2` divergence formerly recorded in-row is closed by owner ruling 2026-08-06 (Q44) · the in-row cross-reference to `M01-03`'s delivery path is amended by owner ruling 2026-08-06 (Q47); no limit in this row is touched by it · the cooldown's release on a confirmed hard delivery failure is added by owner ruling 2026-08-06 (Q51), which likewise leaves every `DOC08.otp-limits` cap this row carries binding | P0 |
| M01-05 | **OTP is single-use with a 5-minute TTL, and no passwords exist anywhere in the product.** Sign-in is phone + 6-digit OTP (plus Google Login per M01-02); there is no password to set, store, forget or phish. | `SRC` — `DOC08.auth-phone-otp` (docs/engineering/08 §auth; the design the rebuild implements per R20's residue note) | P0 |
| M01-06 | **OTP messages are anti-vishing by copy.** Every OTP message states the product name and "we never call to ask for this code"; support never asks for an OTP. | `SRC` — `DOC08.otp-copy` (docs/engineering/08) | P1 |
| M01-07 | **Session lifetimes and revocation.** Web sessions are 30 days rolling. Mobile has no fixed maximum while the person remains active: seven full days without foreground authenticated use expires the session and requires sign-in again. Opening or using the signed-in app in the foreground resets that inactivity window; background refresh, push handling and scheduled work never reset it. Mobile API tokens remain short-lived (≤10 minutes) and renew silently while the underlying session is valid. Deactivating a user, or a user's own "sign out everywhere", kills every device's access within ≤10 minutes. The revocation surface is the Team screen (M01-19). | `SRC` — `DOC08.session-lifetimes`, refined by owner ruling 2026-08-25 (`Q71`) | P0 |
| M01-08 | **A phone number that is already registered never creates a duplicate company.** Signup with a known phone offers login instead — the account is one account, whatever door it walks in through. | `SRC` — `S0.wrong.1` (*retired: journey-stages ledger*) | P0 |
| M01-09 | **A second person from the same company is steered to "request to join".** Signup detects a likely-existing workspace by company name + city and offers "request to join" (routed to that tenant's EPC Owner as an invite request) instead of silently creating a second workspace. Creating a new company remains possible — the detection is a steer, not a block. | `SRC` — `S0.wrong.5` | P1 |
| M01-10 | **Abandoning signup midway loses nothing.** Once the OTP has verified, the person is an account; returning resumes exactly where they left off — no restart, no duplicate. | `SRC` — `S0.wrong.4` | P0 |
| M01-11 | **Signup contains no plan selection, no billing prompt and no payment instrument.** The trial starts without a card (`04-business-model.md` `BM-28`); every billing surface — plan pick, mandate, invoices, trial state — belongs to `modules/M12-platform-billing.md`. The deferred-era wording of the source ("billing is deferred… no trial gate anywhere") is superseded — billing **is** in v1 (OD-4) — but its signup-shaped consequence survives intact: nothing about money interrupts the front door. | `SRC` — `S0.notv1.1` post-overlay (the D38-era text superseded by owner directive OD-4; docs/16 via `BM-28`: no-card trial); `D11`'s billing half → M12 | P0 |

**Behavior detail.** The signup flow is `S0.screen.1` verbatim: phone → OTP → three fields.
Everything after it is §M01.3's progressive setup — signup itself must be completable in under
a minute on a phone. The phone number is normalized to the market's phone specification
(`pack.formats`, F1-21; IN instance F1-49) and becomes the E.164 global identity of the user
(M01-18). Google Login (M01-02) is presented as an alternative on the sign-in screen; because
the account identity is the phone, a Google sign-in resolves to an account carrying a verified
phone — the first Google sign-in runs the linking flow onto that same phone-identity account,
never minting a duplicate (owner ruling 2026-08-04, Q18). OTP entry auto-reads the
code where the platform allows (`S1.screen.2`'s behaviour, shared with invite acceptance).
Empty/error states carry F7's teaching-empty-state contract; the OTP screen's failure states
(wrong code, expired code, locked number) each say what happened and what to do next.

Permissions: none of this area is permission-gated — it runs before roles exist. The first
user of a tenant is created holding the EPC Owner preset (F2-01); the F2-19 invariant (a
tenant always retains ≥1 EPC Owner) holds from the first moment.

**Edge cases & what-goes-wrong** (every S0 auth item present):

- *Phone already registered* (`S0.wrong.1`) → login offered, no duplicate company (M01-08).
- *OTP does not arrive* (`S0.wrong.2`) → visible resend, unlocking at 30 s, then the
  user-initiated "call me instead" voice OTP (M01-03), inside the M01-04 limits; no automatic
  channel fallback fires (owner ruling 2026-08-06, Q47 — this bullet previously read "automatic
  channel fallback + visible resend + 'call me instead'").
- *Owner abandons midway* (`S0.wrong.4`) → account exists, resume on return (M01-10).
- *Two people from the same company sign up* (`S0.wrong.5`) → detect by company name + city,
  offer request-to-join (M01-09).
- *OTP abuse* — request flooding, brute-force verify → the M01-04 limits, each with an honest
  user-facing message, never a silent failure.
- *SMS delivery fails* → loud failure with retry-later copy (M01-03); the front door never
  pretends to be waiting. This bullet previously read "*Both OTP channels fail*" — there is one
  delivery channel now, the automatic secondary one having been removed by owner ruling
  2026-08-06 (Q47).
- *The failure is a **confirmed hard** delivery failure* → the resend cooldown is released
  immediately, so the resend control is usable at once in that state and the user-initiated
  "call me instead" voice OTP is offered there too (M01-03, M01-04, owner ruling 2026-08-06,
  Q51); the M01-04 caps still bind, and a cap already reached governs the state instead, said
  honestly. *(Bullet added by the Q51 closure pass; the edge list previously stopped at the
  loud failure and said nothing about the resend control inside it.)*

**Acceptance criteria.**

- Given a new phone number, when signup completes, then exactly phone, OTP, company name, owner
  name and city were required, a tenant exists with the signer as EPC Owner, and no billing or
  payment step occurred (M01-01, M01-11).
- Given an existing account's phone at signup, when the OTP verifies, then the user is logged
  in to the existing account and no second company exists (M01-08).
- Given an OTP that fails to deliver by SMS, when the failure occurs, then no automatic fallback
  to any other channel fires, login fails loudly with a plain retry-later message, and the resend
  control and the user-initiated "call me instead" voice option are the visible ways forward
  (M01-03, owner ruling 2026-08-06 Q47). *(This criterion previously read "when 30 s elapse or
  delivery fails, then the fallback channel fires automatically and resend + voice options are
  visible" — the ruling removes the automatic fallback it tested.)*
- Given a sent OTP, when the resend control is under its cooldown, then it becomes available
  again after 30 s (M01-04, owner ruling 2026-08-06 Q44). *(Line added by the Q44 closure pass:
  this block previously asserted no cooldown length at all, because the value was the recorded
  30 s vs 45 s divergence M01-04 carried; the ruling supplies it.)*
- Given a confirmed hard SMS delivery failure, when the failure state renders, then the resend
  cooldown is released immediately — the resend control is available with no countdown left to
  wait out — and the user-initiated "call me instead" voice option is offered in that same
  state (M01-03, M01-04, owner ruling 2026-08-06 Q51); given that an M01-04 cap is already
  reached at that moment, then the cap still governs and the message says so honestly (M01-04).
  *(Line added by the Q51 closure pass: this block previously asserted nothing about the resend
  control inside the failure state, the gap M01 §6 carried as the open 0–30 s hard-failure
  question.)*
- Given 5 failed verify attempts, when the fifth fails, then that OTP is invalid and the user
  is told to request a fresh one; given 3 consecutive invalidations, then the number is locked
  15 min with an explanation (M01-04).
- Given a signup abandoned after OTP verification, when the person returns, then setup resumes
  where it stopped (M01-10).
- Given mobile foreground authenticated use before seven full inactive days, when the app is
  used, then its inactivity window restarts and short-lived API tokens renew without showing
  login; given only background activity, the window does not restart; given seven full inactive
  days, the next open requires sign-in (M01-07).
- Given a deactivation or "sign out everywhere", when it is issued, then every session of that
  user ends within 10 minutes (M01-07).
- Given any sign-in surface, when it renders, then no password field exists anywhere (M01-05)
  and Google Login is offered alongside Mobile OTP (M01-02).

**Localization notes.** Signup and OTP screens exist in all launch languages (F3-01), default
to the device locale (`MULTI.5` via F3-03); OTP message copy is translated per F3 with the
product name untranslated. Phone formats and the OTP-destination allowlist come from
`pack.formats` (F1-21/F1-49). **Analytics events:** signup started · OTP sent (channel) ·
OTP verified / failed (reason) · signup completed · signup resumed ·
duplicate-phone login offered · request-to-join offered/sent. *(This list previously carried an
"OTP fallback fired" event between "OTP sent (channel)" and "OTP verified / failed (reason)";
it is removed by owner ruling 2026-08-06 (Q47) — there is no automatic fallback left to
instrument. "OTP sent (channel)" survives and now distinguishes the SMS send from the
user-initiated voice OTP.)*

### M01.2 — Team invites, user onboarding & the roles screens

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-12 | **Invites are phone-keyed and carry at least one preset role.** The Invite screen asks: name, phone number, one or more of F2's twelve presets (F2-21 blocks a role-less invite). Invite states are pending / accepted / expired / revoked, with an expiry; inviting is skippable during onboarding (`S0.screen.4`) and always available later from the Team screen. | `SRC` — `S0.screen.4` ("Add by phone number, pick a role. Skippable."); `DOC04.invites-phone` (docs/04); `F2-21` consumed by ID | P0 |
| M01-13 | **The invite lands personally and accepting is one step.** The invite landing names the inviter and the company (source example: "Rajesh invited you to HelioGrid — Suryodaya Solar"), with the phone pre-filled; OTP is 6 digits, auto-read where the platform allows; verification **atomically** creates the user and attaches tenant membership + roles — there is no half-joined state. | `SRC` — `S1.screen.1`, `S1.screen.2`; `DOC08.invite-attach` (docs/engineering/08: "OTP verification attaches tenant membership + roles atomically"); `DOC04.invites-phone` ("accepting creates the user + roles in one step") | P0 |
| M01-14 | **Profile capture is minimal: name, photo (optional). That is all.** | `SRC` — `S1.screen.3` | P0 |
| M01-15 | **The role is explained in one card** — plain language, from the F2 preset's vocabulary: what they will see and can do ("You're a Sales Executive. You'll see your leads, your follow-ups, and you can send proposals."), and it **sets expectations about what they cannot do**. | `SRC` — `S1.screen.4` (role copy from the preset set — F2-01) | P1 |
| M01-16 | **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.** | `SRC` — `S1.screen.5`; `DOC14.coach-demo-seed` (docs/14: "First-run coach marks (≤3, dismissible)… committed onboarding scope") | P1 |
| M01-17 | **First-run lands on the role-decided home with real work already in it.** An invited person is useful within two minutes without reading anything: tap invite → OTP → name → their role's home screen, showing the work already assigned to them. The role-decides-home mechanics are `02-personas.md` `PS-01` / `modules/M13-dashboards-and-reporting.md`'s; M01 owns the handoff — onboarding ends **on** that home, never on a generic dashboard or an unexplained blank. | `SRC` — `S1.happy`; mechanics per `PS-01` (Task 4 disposition — carried here without re-appending `S1.rec.1`) | P0 |
| M01-18 | **User lifecycle: phone is the login identity (E.164, unique globally); status is invited / active / deactivated — "deactivate, never delete."** Deactivation and the tenant service invariants (always ≥1 EPC Owner; always ≥1 person holding Manage team) are F2's laws (F2-19, F2-20), enforced at the transition and surfaced on this module's screens. | `SRC` — `DOC04.user-lifecycle` (docs/04); `F2-19`/`F2-20` consumed by ID | P0 |
| M01-19 | **The Team screen** lists people with their role chips (all presets held, per F2-10), status (invited / active / deactivated) and last-active; one-tap invite and one-tap deactivate; deactivation warns about open work and prompts reassignment (F2-20). Blocked guard-rail attempts (removing the last EPC Owner or last Manage-team holder) explain themselves (F2-19) and are audit-logged (F2-22). | `SRC` — journey §ROLES & PERMISSIONS screens (L1486–1491) via F2 §4 contract (Task 5 disposition); `DOC08.session-lifetimes` (revocation surface here) | P0 |
| M01-20 | **Assign roles shows a live plain-English grant line.** Assigning presets to a person renders, live, what the combination means — "Rajesh can sell, survey and design" — composed from localized capability phrases (F2 §F2.2). Stacking is the design; there is no other way to widen access (F2-10, F2-15). | `SRC` — journey L1489, L1513–1514 via F2 §4 contract | P0 |
| M01-21 | **The Roles reference is read-only.** It renders F2's preset descriptions and matrices and shows how many people hold each preset (including zero); there is no create, edit, duplicate or delete of roles anywhere (F2-02, F2-16). The v1 config surface for roles is role **assignment**, never a role editor. | `SRC` — `TC.roles.1` (post-overlay: "the v1 config surface is role *assignment* (stacking presets), never a role editor"); journey L1490 via F2 §4 · the row's "who approves what" phrase is carried as written; the no-discount-approval tension it brushes is recorded in F2 §5 / M06 (D34), not re-litigated here | P0 |

**Behavior detail.** The invite flow is the product's second first-impression and is held to
the same under-a-minute bar as signup. An invite delivers as a message to the invitee's phone
(platform-sent, on the platform's own rail — this is not tenant messaging and does not touch
D32); the landing works on both platforms and web. Role explanation copy (M01-15) derives from
F2's preset definitions so it can never drift from the matrix truth. The first-run landing
(M01-17) obeys each persona's home from `02-personas.md`; where the person's presets span
domains, the composition rule is M13's recorded decision (`M13-10`, register Q5 — decision
recorded) — M01 does not invent one.
Invite expiry produces the `S1.wrong.1` path below; revocation of a pending invite is one tap
on the Team screen. All role changes write old → new audit entries (F2-22).

Permissions: inviting, deactivating and role assignment require `F2.M01.manage-team` (EPC
Owner-only; not delegated to HR/Admin — F2 §F2.1). The Team screen's *read* view follows the
same grant in v1; every user can always see their own roles explained (M01-15's card re-openable
from their profile).

**Edge cases & what-goes-wrong** (every S1 item present):

- *Invite expired* (`S1.wrong.1`) → "Ask {inviter} to invite you again", with a **one-tap
  request** that notifies the inviter; nothing dead-ends.
- *Wrong person got the invite* (`S1.wrong.2`) → decline action on the landing; declining
  notifies the EPC Owner and voids the invite.
- *Role has nothing assigned yet* (`S1.wrong.3`) → the role home renders a teaching empty
  state that says what will appear here and who to ask — never a blank screen (F7's
  empty-state contract).
- *Owner removes them later* (`S1.wrong.4`) → graceful "your access was removed" screen, no
  crash, no data loss on device; sessions end within the M01-07 window; their history stays
  attributed (F2-20).
- *Invite sent to a number that is already a member* → the invite surface says so and offers
  the Team screen instead of sending.
- *Invite flooding* → the per-tenant daily invite cap (M01-04) with an honest message.

**Acceptance criteria.**

- Given an invite with zero roles, when it is submitted, then it is blocked before sending
  (M01-12, F2-21).
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles
  exist atomically and the next screen is name/photo, then the role card, then their role's
  home with their real assigned work (M01-13, M01-14, M01-17).
- Given a first-run landing, when coach marks render, then there are at most three, on that
  screen, each dismissible, and no carousel exists (M01-16).
- Given an attempt to deactivate the last EPC Owner, when it is submitted, then it is blocked
  with an explanation and the blocked attempt is audit-logged (M01-19, M01-18, F2-19/F2-22).
- Given a deactivated person, when the Team screen is read, then their history remains
  attributed to them, their role chips and status render, and they are absent from assignment
  pickers (M01-19, M01-18, F2-20).
- Given the Assign-roles screen, when presets are toggled, then the plain-English grant line
  updates live to describe exactly the resulting grants (M01-20).
- Given the Roles reference, when it renders, then it is read-only, shows per-preset holder
  counts, and no role-editing action exists (M01-21).

**Localization notes.** Invite messages render in the tenant's default language (M01-60) with
the invitee able to switch language at first run (F3-03); role names and the grant line use
localized capability phrases (F2 localization notes); coach-mark copy translated per F3.
**Analytics events:** invite sent / accepted / declined / expired / revoked · re-invite
requested · first-run completed (time-to-home) · coach marks dismissed · role assigned /
removed (old → new — also audit events) · deactivation.

### M01.3 — Progressive setup, business profile & the demo project

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-22 | **The minimum-first law.** The product asks for the minimum to produce one real proposal and collects the rest when it is actually needed. The named trap is a requirement: the product never demands catalog, tax registration, logo, price book or team up front — "most B2B SaaS asks for everything up front… and people abandon." Goal: from "I signed up" to "my team can quote a job" without a training session. | `SRC` — `S0.rule.minimum-first` (journey Stage 0 @119–124); `TC.principle.1` (config as first-class surface) | P0 |
| M01-23 | **"What do you sell?" seeds defaults.** One step: Residential / C&I / both, and typical system size — used to seed sensible defaults so the first proposal is close. Stored as the tenant's segment + typical-kW declarations. | `SRC` — `S0.screen.2`; `DOC04.tenant-onboarding-fields` (docs/04: segment, typical system kW "seeds first-quote defaults") | P0 |
| M01-24 | **The company profile is skippable and prompted in context.** Logo, tax registration, address, bank details are a skippable onboarding step — prompted later, **when the first proposal is about to be sent** (the moment they are actually needed). Tax registrations stay empty until that first proposal; the registration *types* that exist come from the tenant market's `pack.tax` (F1-13). | `SRC` — `S0.screen.3` (the IN-named field of the source is the IN instance of pack tax-registration data — F1); `DOC04.tenant-onboarding-fields` ("tax registrations empty until first proposal") | P0 |
| M01-25 | **Tax-registration entry validates live, explains the format, and allows skip.** A malformed registration is explained against the market's format (from `pack.tax`), never silently rejected and never a hard wall — skip remains available until the send moment forces the prompt again. | `SRC` — `S0.wrong.3` ("Wrong [tax-ID] format → validate live, explain the format, allow skip"; format is F1 pack data) | P0 |
| M01-26 | **"You're ready" offers two doors: create your first lead, or open the demo project.** The happy path holds: sign up → pick what you sell → skip the rest → land on an empty Leads screen that teaches → first lead created in under a minute (quick-add itself is `modules/M02-crm-and-leads.md`'s). | `SRC` — `S0.screen.5`; `S0.happy` | P0 |
| M01-27 | **A demo project ships per market pack, ready on day one.** Every new tenant starts with a finished, realistic demo project supplied as market-pack demo content — a real rooftop of that market's kind, pre-loaded through survey, design and proposal — so new users learn by opening something finished, not an empty state, and the demo is the safe place to learn the design studio "without fear of breaking a real quote". The IN pack's demo content is the source's Pune-class residential rooftop; every other market authors its own. **Placement ruled (owner ruling 2026-08-04, Q19):** the demo project ships as **pack content** — versioned with the pack per `F1-11`, beside the eight rules keys, not a ninth key (`F1-02` carries the note). | `SRC` — `S0.rec.1` (elevated from recommendation to committed scope by `DOC14.coach-demo-seed`: "a demo Pune project seed [is] committed onboarding scope"; `DOC00.demo-rooftop` disposed by Task 3 to this module) · globalized per design spec §6; pack-content placement per owner ruling 2026-08-04 (Q19) | P0 |
| M01-28 | **Nothing is required on day one; a tenant with no config at all breaks nothing.** Every setting has a working platform default; a tenant can sign up and send a real proposal without opening settings once. Zero-config fallback is total: "everything falls back to platform defaults and nothing breaks." | `SRC` — `TC.config-ux.1`; `TC.wrong.6` | P0 |
| M01-29 | **Configure in context, not in a settings maze.** The moment a person needs a thing that is not configured — a component they stock, a logo about to print, a bank detail about to render — the product offers to set it **there**. "Settings screens exist for revisiting, not for setup." The sharpest instance is the catalog's inline add (M01-39). | `SRC` — `TC.config-ux.2` | P0 |
| M01-30 | **Every config screen shows the effect.** Live preview is the norm: the proposal with your logo, the agent's opening line spoken aloud (M07 surface), the payment tranches as the customer sees them. | `SRC` — `TC.config-ux.3` | P1 |
| M01-31 | **One Business profile screen feeds many places.** Company name, logo, address and tax registration are asked once and used by the proposal, the agent's script, the customer link and the invoice — never asked twice by different surfaces. | `SRC` — `TC.config-ux.4` (the invoice consumer is real post-overlay — billing is v1) | P0 |

**Behavior detail.** Progressive setup is a *sequence of skippable moments*, not a wizard that
must complete: after M01-01's three fields, the only further onboarding steps are M01-23 (two
questions), the skippable M01-24, the skippable invite step (M01-12), and the two-door landing
(M01-26). Every skipped item has exactly one later prompt-point, at its moment of need:
company profile → first proposal send; catalog → first component pick (inline add); payment
terms/templates → first builder use of their step (tenant defaults already work); bank details
→ the builder's bank step. Prompt-points offer *do it now inline* or *keep skipping* — the
product never blocks progress on configuration except where a legal or money gate rules
otherwise elsewhere (e.g. M06's Generate-time checks). The demo project (M01-27) is clearly
labelled as demo everywhere it appears, excluded from real pipeline counts and reports (M13
contract), and safely resettable; it is also the GTM demo asset. The business profile screen
(M01-31) is the single write-point for identity facts; consumers reference it.

Permissions: the setup steps and business profile are `F2.M01.manage-tenant-settings` (EPC
Owner). Settings changes, branding included, are audit events (F2-22).

**Edge cases & what-goes-wrong.**

- *Wrong tax-registration format* (`S0.wrong.3`) → live validation with the format explained,
  skip allowed (M01-25).
- *A tenant with no config at all* (`TC.wrong.6`) → platform defaults everywhere; sending a
  real proposal works (M01-28).
- *Demo mistaken for real work* → the demo project is labelled on every surface it reaches and
  never counts in pipeline, forecast or reports.
- *Owner skips everything, then a consumer needs a skipped fact* → the in-context prompt-point
  fires exactly there (M01-29); declining leaves the working default in place.
- *Logo uploaded at the profile step is invalid* → validated on upload with the actual limits
  stated (the S6B.wrong.5 pattern; the builder's own logo constraints are M06's).

**Acceptance criteria.**

- Given a fresh tenant that skipped every skippable step, when the owner builds and sends a
  real proposal, then no settings screen was ever required and platform defaults carried it
  (M01-22, M01-28).
- Given the onboarding sequence, when it runs, then segment + typical size are asked (M01-23),
  company profile and invites are skippable (M01-24, M01-12), and the final screen offers
  exactly the two doors (M01-26).
- Given a skipped company profile, when the first proposal is about to be sent, then the
  prompt to complete it fires there, inline (M01-24, M01-29).
- Given a malformed tax registration, when it is typed, then validation is live against the
  market pack's format, the format is explained, and skip remains available (M01-25).
- Given any new tenant, when they land after onboarding, then the market-pack demo project
  exists, opens complete (survey → design → proposal), and is labelled demo everywhere
  (M01-27).
- Given the business profile, when any consumer surface needs company identity facts, then it
  reads the one profile and the user is never asked to re-enter them (M01-31).

**Localization notes.** Setup copy in all launch languages; the segment labels
(Residential / C&I) are product vocabulary translated per F3; tax-registration names and
formats are pack label data (F1-21/F1-22 — the module never names one market's tax ID in UI
copy). Demo-project content is market-pack content and arrives localized for the market.
**Analytics events:** setup step viewed / completed / skipped (which) · prompt-point fired /
completed / declined (which fact) · demo opened · demo reset · first-lead door vs demo door
taken · business profile completed.

### M01.4 — Catalog

The module's largest area. The V2 catalog design is DD8–DD11 (owner-ruled, design spec §2,
elaborated §9–§10), carried here as requirements: a **two-tier** model — one market-scoped
platform master catalog plus the tenant's own SKUs and sparse overrides — with self-serve
addition everywhere, bulk import with smart matching, unified search, scheme-keyed
certification badges, archive-never-delete, and versioned releases that designs and proposals
pin. The component-*picker* pattern that consumes all of this is specified in
`modules/M05-design-studio.md` / `modules/M06-proposals.md` (DD12); the requirements below are
the catalog side that picker relies on.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-32 | **One catalog surface, two tiers, one resolution order.** The catalog a tenant sees is resolved as: **tenant override → tenant own item → platform item**. Platform master catalog (curated by the platform) + tenant own SKUs + sparse tenant overrides collapse into one browsing/search surface with a rates panel — never two catalogs to administer. The old spec's duplicate catalog row is void (R13). | `SRC` — `R13` (docs/15 §1, the two-tier ruling; catalog-mechanics half — the scheme-data half is `F1-19`/`F1-44`, Task 6); `DOC04.catalog-two-tier`; `TC.catalog.1`; `EOD-5` / `UD-4` (owner decisions, verbatim "two-tier catalog: yes") | P0 |
| M01-33 | **The platform master catalog is market-scoped.** There is one global platform catalog; every item carries market availability, and a tenant sees exactly **their market's slice** plus their own SKUs. No tenant ever browses another market's items; no market's regulatory colour leaks into another's picker. | `BRIEF` — design spec §2 **DD8** ("Market-scoped master catalog… Tenants see their market's slice + their own SKUs") · grounded in `R13` (platform master catalog) and `DOC02.market-pack-unit` ("catalog scope" is pack data, `F1-01`) | P0 |
| M01-34 | **Items carry typed per-kind engineering specs with scheme-keyed certifications, and pickers badge compliance.** Platform items are curated with typed specifications per component kind; certifications are **scheme-keyed** on the spec — the tenant market's pack declares which schemes apply (F1-19; the IN pack declares its two schemes with list references and flags, F1-44) — and every picker and search result badges compliance per those schemes. An empty scheme set means no badges, never an error. Brand and model names are never translated (F3-08). Platform items are read-only to tenants (overrides are the only tenant-side write on them, M01-37). | `SRC` — `DOC04.catalog-certifications` (docs/04); `R13` as amended (scheme-keyed structure); `CG-1` (badge/flag half — the money-path gate that consumes subsidy-tied schemes at Generate is `modules/M06`'s; the pack rule is `F1-34`) | P0 |
| M01-35 | **Every catalog item carries a data-provenance label.** Platform-curated items carry verified-datasheet provenance; tenant-entered items carry tenant-provided provenance; representative/sample data is labelled as such. The label is honest about where a spec came from and rides into the picker (F8 surfaces it; `F8-14` consumes it). Provenance labelling — not gatekeeping — is what does the accuracy work in a self-serve catalog (design spec §9). | `SRC` — `DOC04.catalog-provenance` (docs/04: the three-value provenance enum, carried market-neutrally as verified-datasheet / tenant-provided / representative); surfacing per F8 (`F8-06`, `F8-14` cites) | P0 |
| M01-36 | **Tenants add their own SKUs anytime — self-serve, no approval.** A tenant SKU is a full catalog item (typed specs, rates, per-kind fields) usable everywhere a platform item is; it is theirs alone, invisible to other tenants. Nothing about adding requires the platform's involvement. | `BRIEF` — design spec §2 **DD9** ("Self-serve… Tenants add own products anytime") · grounded in `R13` ("tenant own catalog") and `TC.config-ux.2` | P0 |
| M01-37 | **Overrides on platform items are sparse: price, tax rate, hide, preferred.** A tenant override carries only the fields the tenant changed — an unset field falls through to the platform value; one override per platform item. Visibility (hide) removes an item from that tenant's pickers without touching the platform item; preferred pins it forward in search and picker ordering. | `SRC` — `DOC04.catalog-two-tier` ("Tenant overrides are sparse (null field falls through)… overrides carry visibility (visible/hidden) and preferred flags"); DD8's "sparse overrides price/tax/hide/preferred" (design spec §2/§9) | P0 |
| M01-38 | **Unified search spans both catalogs, filterable to either.** One search over the platform slice + own SKUs together, with filters: source (platform / own), component kind, key spec ranges (e.g. wattage, technology), certification-scheme badges (per the market's declared schemes), preferred, archived. Search behaviour is shared with the picker (DD12) — the picker searches this catalog, with these filters. | `BRIEF` — design spec §2 **DD9** ("Unified search spans global + own catalog, filterable to either") · filter vocabulary grounded in the studio census's picker filters (design spec §10; census is M05's baseline) | P0 |
| M01-39 | **Inline add everywhere: the moment a needed product is missing, add it there.** From the proposal builder's and studio's component picker — and from Catalog settings — a person with the grant can add a missing product **in-flow**, by any of three paths: (a) a single-product form, (b) **datasheet PDF extraction** (M01-40), (c) **spreadsheet upload** (M01-41). The new SKU is immediately picked and the flow continues; nobody leaves the builder to go to settings. | `SRC` — `TC.config-ux.2` ("The moment a rep needs a component product they do not stock, offer to add it to the catalog *there*") · extended by `BRIEF` design spec §2 **DD9** (inline at proposal/design time incl. datasheet PDF + Excel in-flow) | P0 |
| M01-40 | **Datasheet PDF extraction is a first-class add path.** Upload a manufacturer datasheet; the product extracts the typed spec fields for that component kind and presents them **for review and correction before the item is created** — extraction output is never committed silently. The created SKU carries tenant-provided provenance, and the source datasheet stays attached to the item. Extraction failure degrades to the manual form with anything salvaged pre-filled — never a dead end. | `BRIEF` — design spec §2 **DD9**/**DD12** (datasheet PDF extraction as an entry path; competitively validated §10 — "Nobody has self-serve datasheet PDF extraction") · review-before-commit per the suite's AI-output law (F8; accept/adjust — never applied silently) | P0 |
| M01-41 | **Spreadsheet (Excel/CSV) import with smart matching is P0, available at onboarding, in settings, and at proposal time.** Guided import: upload → column mapping with auto-guess → preview → import report. **Smart matching:** rows that match platform products become **price overrides** on those items (never duplicate SKUs); unknown rows become **tenant SKUs**; rows with problems are **fixed inline** in the preview, not bounced to a failed file. The import runs async with visible progress and a per-row failure report. | `BRIEF` — design spec §2 **DD10** (verbatim behaviours) · wizard shape per the UXG-01 import pattern (cited — M02 owns the lead-import instance) | P0 |
| M01-42 | **Archive, never delete.** Removing a product archives it: archived items leave pickers and search defaults (surfaceable by filter), while **every existing reference keeps working** — old proposals keep serving, draft proposals keep their components, designs keep their BOM lines. Deleting a catalog item does not exist. | `SRC` — `DOC04.catalog-two-tier` ("Archive, never delete: removed products keep serving old proposals"); `TC.wrong.4` ("the draft keeps its components; the product is archived, not destroyed") | P0 |
| M01-43 | **Catalog releases are labelled and append-only; designs and proposals pin the release they used.** Publishing catalog changes produces a labelled release; the release label rides into every design fingerprint and proposal version that used it, and a release publish **self-stales** every design pinned to an older label (staleness law F8-13/F8-14 — staleness is derived by comparison, never silent recompute). Sent proposals keep their pinned versions forever (F8-15). | `SRC` — `DOC04.catalog-release-stale` (docs/04); pinning consumers per `DOC04.design-freshness-pins` / `DOC04.proposal-versions-immutable` (cited — F8/M06 own their halves) | P0 |
| M01-44 | **Rate history on tenant items and overrides is versioned.** Every price change on a tenant SKU or override is a new dated entry, never an in-place edit, so any past output can name the rate it used (this is the catalog's half of rate versioning; the non-catalog half is the price book, §M01.5). | `SRC` — `R13` ("Catalog rate history is the versioned rate history on tenant items/overrides") | P0 |
| M01-45 | **The catalog holds MLPE components (micro-inverters, optimisers) as items.** Holding the components is this module's half; the string-sizing ladder and the deliberate absence of an MLPE electrical model are `modules/M05-design-studio.md`'s (its recorded non-goal). | `SRC` — `CG-15` (docs/12 verdict DESIGN-FOR: "Catalog holds the components in v1"; M05 half stays with Task 15) | P1 |
| M01-46 | **No tenant request queue exists, and platform-book population is never a tenant dependency.** A tenant never files a ticket, emails support, or waits on the platform to be able to quote — the self-serve paths (M01-36/39/40/41) are the whole answer. Populating and curating the platform master book (datasheet ingestion at scale) is **internal platform operations** — noted here as context, not a tenant-facing feature of this module. | `BRIEF` — design spec §2 **DD9** ("no request queue"; "Platform-book population… is internal platform ops, never a tenant dependency") · the rejected request-queue alternative is recorded in §5 Non-goals | P0 |

**Behavior detail.** *Resolution* (M01-32) is invisible to users: a picker shows one list, and
an item's effective price/tax/visibility is the resolved value; the rates panel on Catalog
settings shows, per item, which tier supplied each field (platform value struck under an
override, own-SKU values plain) so an owner can always answer "why is this price showing".
*Search* (M01-38) ranks preferred items first, then relevance; archived items appear only under
the archived filter. *Inline add* (M01-39) opens as a sheet over the picker (F7's
sheets-not-pages contract), pre-scoped to the component kind being picked; on save the sheet
closes and the new SKU is selected in place. *PDF extraction* (M01-40) shows extracted fields
in the same typed form as manual entry, each field editable, with the datasheet preview
alongside; nothing commits until the person saves. *Import* (M01-41): the preview states, in
plain numbers, "N rows · M match platform products (will become price overrides) · K new
products · E rows need attention"; fixing happens in the preview grid; the import report is
kept and re-openable. Import is one wizard reused at its three entry points — onboarding,
Catalog settings, and the picker's add-flow. *Archive* (M01-42): archiving from settings warns
when the item is referenced by open drafts (count shown) and proceeds without breaking them;
`modules/M05`'s out-of-stock flagging (S5.wrong.4) and `modules/M06`'s pricing pins consume
this behaviour. *Releases* (M01-43): a release is the publish act of catalog administration;
the release label is a human-readable name plus date; what a release contains (which items
changed) is inspectable. Certification badges (M01-34) render from pack-declared schemes only
— the module never hard-codes a scheme name; the IN pack's schemes and the subsidy-path
consumption are F1-44/F1-34, and the Generate-time compliance failure is M06's gate.

Permissions: catalog administration — authoring platform-item overrides, archiving, publishing
releases, and full own-SKU management from settings — is `F2.M01.manage-catalog` (EPC Owner +
Operations; Finance views prices & margins; DD11). **Inline own-SKU add** while building is
`F2.M01.add-own-catalog-items` (EPC Owner, Sales Manager, Sales Executive, Design Engineer,
Operations) — the grant follows proposal/design authoring so DD9's "add it there" is real for
the people who hit the gap. All twelve presets *pick from* the catalog (picking is not
managing — F2 §F2.5-M01 note). Catalog and price-book changes are audit events (F2-22).

**Edge cases & what-goes-wrong.**

- *Tenant removes a catalog product still used by a draft proposal* (`TC.wrong.4`) → the draft
  keeps its components; the product is archived, not destroyed (M01-42).
- *Panel out of stock / discontinued* (`S5.wrong.4`, cited — M05 owns the flag surface) → the
  catalog flags it; existing proposals keep their original pricing (M01-42, M01-43).
- *Import file matches a platform product at a different spec* → smart matching treats spec
  conflicts as needs-attention rows, fixed inline; matching never silently overwrites specs —
  a match creates a **price override**, not a spec edit (M01-41, M01-37).
- *Import re-run with the same file* → matched rows update the tenant's overrides (a new rate
  version, M01-44), never duplicate SKUs (M01-41).
- *PDF extraction gets a field wrong* → the review step exists precisely for this; the person
  corrects before commit; nothing silently enters the catalog (M01-40).
- *Extraction fails entirely (scan, photo, unusual layout)* → manual form with whatever was
  salvaged; the datasheet still attaches to the item (M01-40).
- *Two people edit catalog settings concurrently* → edits are server operations; last write
  wins per server apply order with the audit trail showing both (F2-22).
- *A hidden (override-hidden) platform item is referenced by an old proposal* → the reference
  keeps working; hide affects pickers only, never history (M01-37, M01-42).

**Acceptance criteria.**

- Given a tenant with an override on a platform item, when any surface resolves that item,
  then the override's set fields win, unset fields fall through to the platform value, and own
  SKUs shadow nothing (M01-32, M01-37).
- Given a tenant in market A, when they browse or search the catalog, then only market A's
  platform slice plus their own SKUs appear (M01-33).
- Given a market whose pack declares certification schemes, when the picker or search renders
  an item, then compliance badges for exactly those schemes appear; given an empty scheme set,
  then no badges and no errors (M01-34).
- Given any catalog item, when it renders in detail or picker, then its provenance label
  (verified-datasheet / tenant-provided / representative) is visible (M01-35).
- Given a missing product mid-proposal, when the person invokes add-in-flow, then single-form,
  datasheet-PDF and spreadsheet paths are all available, and completing any of them selects
  the new SKU in place without leaving the builder (M01-36, M01-39).
- Given a datasheet PDF upload, when extraction completes, then every extracted field is shown
  for review and nothing is created until the person confirms (M01-40).
- Given an import file with platform-matching rows, unknown rows and broken rows, when the
  preview renders, then it states the three counts, matched rows become price overrides and
  unknown rows tenant SKUs on import, and broken rows are fixable inline; the import runs
  async with progress and produces a per-row report (M01-41).
- Given an archived product referenced by an old proposal, when that proposal renders, then
  every line still resolves and prices are unchanged (M01-42, M01-43).
- Given a catalog release publish, when designs pinned to an older label are next read, then
  they read as stale per F8 — visibly, never silently recomputed — and sent proposals are
  untouched (M01-43).
- Given a search query with the source filter set to "own", when results render, then only
  tenant SKUs appear; given no source filter, then platform-slice items and own SKUs rank in
  one list with preferred items first (M01-38).
- Given a rate change on a tenant SKU or override, when it is saved, then a new dated rate
  entry exists and every prior output can still name the rate it used (M01-44).
- Given any missing-product moment anywhere in the product, when the person looks for a way
  to request the platform add it, then no request queue, ticket or support path exists — the
  self-serve paths are the whole answer (M01-46).
- Given a person without `F2.M01.manage-catalog`, when they open Catalog settings, then
  administration actions are absent; given a person with `F2.M01.add-own-catalog-items` in the
  picker, then inline add is present (permissions).

**Localization notes.** Brand and model names are never translated (F3-08); spec labels and
units follow F3's unit law (kW/kWh/kWp untranslated); certification-scheme names are
pack-declared proper nouns, untranslated; catalog UI copy in all launch languages. Import
column auto-guess must handle headers in any launch language. **Analytics events:** catalog
searched (source filter, badge filters) · item added (path: form / pdf / import; entry point:
onboarding / settings / in-flow) · extraction reviewed (fields corrected count) · import
started / completed (rows, matched, created, errors) · override created / cleared · item
archived / unarchived · release published · preferred toggled · hide toggled.

### M01.5 — Price book

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-48 | **The price book holds versioned rates for everything that is not a catalog item.** Non-component rates (service and installation charges, engineering fees, per-kW adders and comparable non-catalog rates) live in the tenant price book as **immutable versions**: a price update creates a new version, never mutates rates in place; exactly one version is active per tenant; a default margin percentage rides the version. Rates are denominated in the tenant's one currency (F1-07). | `SRC` — `DOC04.pricebook-versions` (docs/04); `R13` ("`price_book_versions` exists as a separate [structure] for non-catalog rates"); `TC.pricebook.1` ("Rates per component, versioned so old [proposals] keep their prices" — vocabulary per R1) | P0 |
| M01-49 | **Sent proposals keep the rate versions they were built with — always.** A price-book update after a proposal is sent changes nothing about the sent document: it pins its price-book version and catalog release at generation (F8-15's law; this module supplies the versioned structures that make the pin possible). Publishing a new version self-stales unsent outputs per F8-13/F8-14; it never rewrites anything. | `SRC` — `R13` ("sent proposals keep the rate version they were built with"); `TC.wrong.5` ("Price book updated after [proposals] were sent → sent [proposals] keep original prices, always"); consumed suite-wide via `F8-15` | P0 |

**Behavior detail.** The price book renders as the rates panel of the one catalog surface
(R13: "the settings screen shows ONE catalog with a rates panel") — component rates resolve
through the catalog tiers (M01-32/M01-44); non-component rates come from the active price-book
version. Publishing a version is an explicit act with a summary of what changed; past versions
are browsable read-only. The default margin (riding the version) is the builder's starting
margin, adjustable per proposal (M06's mechanics). Draft proposals and designs re-read the
active version on their staleness check (F8-13) — a draft built against version *n* visibly
stales when *n+1* activates, and the person chooses to re-price or keep building toward a
regenerate.

Permissions: publishing price-book versions is `F2.M01.manage-catalog` (EPC Owner +
Operations, DD11); **Finance** holds view of prices and margins; margin figures never render
on surfaces reached by presets without a money grant (F2's surface laws). Version publishes
are audit events (F2-22).

**Edge cases & what-goes-wrong.**

- *Price book updated after proposals were sent* (`TC.wrong.5`) → sent proposals keep original
  prices, always (M01-49).
- *A draft was priced against the previous version* → the draft reads as stale per F8, shown
  before anything regenerates; money never silently moves (F8-12/F8-13).
- *Two versions edited concurrently* → versions are immutable and publishing is serialized
  server-side; the audit trail shows both attempts (M01-48, F2-22).

**Acceptance criteria.**

- Given any rate change, when it is saved, then a new price-book version exists, the old one
  is untouched and browsable, and exactly one version is active (M01-48).
- Given a sent proposal and a subsequent version publish, when the sent document is viewed by
  anyone, then every figure equals the figures at send time (M01-49).
- Given a draft pinned to an older version, when it is opened after a publish, then it is
  visibly stale and requires an explicit re-price — never a silent recompute (M01-49, F8-13).

**Localization notes.** Rate names are tenant data (per-language where the tenant authors
them); currency rendering per F3's single money formatter with the pack's format values
(F3-19/F3-20, F1-21). **Analytics events:** price-book version published (rate count changed) ·
version browsed · margin default changed.

### M01.6 — Branding & document templates

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-50 | **Branding settings: logo, letterhead, brand colour, company details — applied to customer documents only.** The tenant's branding rides proposal PDFs and customer-link pages; the operator app is never restyled per tenant (F7-07's law — no tenant CSS, no theme upload, no palette). On palette save, contrast is re-verified computationally; a palette is never rejected — compliant shades are derived and **previewed live** (M01-30's law applied here). | `SRC` — `TC.branding.1` (journey L1241; the settings-surface half — the law half is `F7-07`, Task 9); `DOC10.tenant-branding` (surface half; law disposed by Task 9) | P0 |
| M01-51 | **Proposal template settings: cover, sections included, default terms & conditions, bank details.** These are the tenant's document defaults, consumed by the proposal builder; the document is named "Proposal" in every locale (R1, consumed via F3-11). Bank details entered here are the business profile's (M01-31) — one write-point. | `SRC` — `TC.templates.1` (journey L1245); `DOC04.tenant-settings` ("proposal defaults (T&C pages, timeline template, default tranche template)") | P0 |
| M01-52 | **Project-timeline template: default phases and descriptions**, editable and reorderable, consumed as the builder's timeline step default. | `SRC` — `TC.timeline.1` (journey L1247; the builder step itself is `modules/M06`'s — `S6B.step.6` cited) | P1 |
| M01-53 | **Tenant defaults feed the proposal builder's Quick mode.** The defaults this area and §M01.7 define — timeline template, default tranche template, default T&C, bank details — are exactly what Quick mode fills for its hidden steps; a tenant who never opens settings still has working platform defaults there (M01-28). Quick mode itself, and its loss-free expansion, are `modules/M06-proposals.md`'s (R11). | `SRC` — `R11` (docs/15 §1; the "tenant defaults for steps 6/7/9/11 → M01" half — Quick mode's behaviour stays with M06) | P0 |

**Behavior detail.** Branding preview shows the actual proposal cover and customer-link header
with the tenant's logo and derived-compliant colours before saving (TC.config-ux.3). Template
edits version forward simply (last saved wins, audit-logged); documents already generated are
immutable per F8-15 and never restyle retroactively. T&C templates support the builder's
"save as template" round-trip (M06's S6B.step.9 — cited). Every default here has a working
platform value from day one (M01-28).

Permissions: `F2.M01.manage-tenant-settings` (EPC Owner). Branding and settings changes are
audit events (F2-22).

**Edge cases & what-goes-wrong.**

- *Palette fails contrast* → never rejected; compliant shades derived and shown live, the
  tenant sees exactly what customers will (M01-50).
- *Logo too large / wrong format* → validated on upload with the actual limits stated (the
  `S6B.wrong.5` pattern; the builder's instance is M06's).
- *Template edited after documents were sent* → sent documents unchanged (F8-15); new
  generations use the new template.

**Acceptance criteria.**

- Given any branding save, when it completes, then the operator app is visually unchanged and
  only customer documents carry the branding (M01-50).
- Given a branding or template edit, when it is saved, then a live preview of the affected
  customer document was available before saving (M01-50, M01-30).
- Given the proposal-template settings, when the builder generates a document, then cover,
  included sections, default terms and bank details come from these settings (or their
  platform defaults), and the document is titled with the ruled name in every locale
  (M01-51).
- Given a tenant with untouched template settings, when Quick mode builds a proposal, then the
  platform defaults fill the hidden steps and the result is generable (M01-53, M01-28).

**Localization notes.** Template content is tenant data authored per language (F3-10's class);
document rendering is script-correct per F3-15. **Analytics events:** branding saved (palette
derived? logo?) · template edited (which) · timeline template changed · T&C template saved.

### M01.7 — Payment terms (tranche templates)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-54 | **Named tranche templates.** A tenant manages named payment-term templates — each a list of tranches (label + percentage) whose percentages sum to **exactly 100.00**, each tranche tied to the canonical project stage it falls due on (market-neutral stage names; display labels per the pack, F1-22). The platform seeds two standard templates at tenant creation (the source's 10/60/20/10 and 30/60/10 splits) and one template is the tenant default. Editing a template never changes documents already generated from it (F8-15). | `SRC` — `TC.payment-terms.1` (journey L1246: "Named tranche templates"); `DOC04.tranche-templates` (docs/04; the management-surface half — the money path, due-on-stage mechanics and collection schedule are `modules/M11-payments-and-collections.md`'s) | P0 |

**Behavior detail.** The template editor is the same control the builder's payment step uses
(one pattern); a live preview shows the tranches as the customer will see them
(TC.config-ux.3). The 100.00 rule validates in the editor with the remainder shown ("12%
unallocated" — the S6B.wrong.3 pattern, whose Generate-time enforcement is M06's). Stage
binding uses the canonical stage set; which stages exist/skip per market is pack data (F1-22)
— the editor only offers real stages for the tenant's market. Templates feed: the builder's
payment-terms step default, Quick mode (M01-53), and — at Won — the project's collection
schedule (M11's one-money-path contract).

Permissions: `F2.M01.manage-tenant-settings` (EPC Owner). Tranche-template edits are audit
events (F2-22 — money-adjacent settings).

**Edge cases & what-goes-wrong.**

- *Percentages ≠ 100* → the editor blocks save with the remainder shown (the builder's
  Generate-time instance is M06's).
- *Template deleted while proposals reference it* → templates archive, never delete; generated
  documents carry their own snapshot (F8-15) and never point back live.
- *A stage a tranche is due on is skippable in this market* → the editor warns and M11's
  due-derivation rules govern (contract, §4).

**Acceptance criteria.**

- Given a new tenant, when settings are first opened, then the two seeded templates exist and
  one is marked default (M01-54).
- Given a template whose tranches sum to anything but 100.00, when save is attempted, then it
  is blocked with the unallocated remainder stated (M01-54).

**Localization notes.** Template and tranche labels are tenant data per language; percentages
and money render per F3. **Analytics events:** tranche template created / edited / archived ·
default changed.

### M01.8 — Message templates

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-55 | **Message templates are tenant data, authored per language, for the transactional moments the product composes:** the proposal share message, the follow-up nudge, the reminder. Templates exist in all launch languages as authored content — never translation-catalog strings (F3-10). The composed message **sends from the tenant's connected transactional channel where one exists, and is copy-paste for a person to send where none is** (owner ruling 2026-08-04, Q33 — `M03-03`; on the fallback path the app claims no delivery, D32's surviving discipline). Missing-language behaviour follows the ruled fallback: show the original language with a small note (owner ruling 2026-08-04, Q10; `F3-10`). | `SRC` — `TC.message-templates.1` (journey L1251); `DOC10.templates-are-data` (the template-management-surface half — the content-class law is `F3-10`, Task 8); `DOC14.message-templates` ("Tenant message templates in 3 languages are committed scope"); send rail per owner ruling 2026-08-04 (Q33) | P0 |

**Behavior detail.** Each template shows its variables (customer name, proposal link, amount —
amount rendering obeys F8's staleness and F3's money format) and a live preview per language
(TC.config-ux.3). Templates serve the share and follow-up surfaces of `modules/M06` /
`modules/M07`; per the owner ruling of 2026-08-04 (Q33) the composed output now sends from the
tenant's connected transactional channel where one exists, with copy-paste as the no-channel
fallback (`M03-03`; `registers/conflicts.md` row 4 carries the resolution) — the campaign lane
(`modules/M03`) remains a separate surface.

Permissions: `F2.M01.manage-tenant-settings` (EPC Owner). **Edge cases:** a template referencing
a variable the context lacks previews with the gap visible and composes with a safe omission,
never a raw placeholder in a customer's message; the missing-language case shows the original
language with a small note per Q10's ruled fallback (owner ruling 2026-08-04; `F3-10`). **Acceptance criteria:** Given a tenant in any launch language, when a rep invokes the
share message, then the composed text uses the tenant's template for the recipient-appropriate
language, with every variable resolved or safely omitted (M01-55). **Localization notes:**
the whole area is F3-10's content class. **Analytics events:** template edited (which,
language) · template preview used.

### M01.9 — Agent & voice setup (tenant-config surface; detail in M07)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-56 | **The governing principle of agent configuration: fully tenant-owned, within the statutory floor.** Nothing about the agent is platform-locked *except* the market's statutory ruleset, which is **enforced** by the product's compliance gate — never merely surfaced: "Tenants configure within the law, not around it." The floor's content is market-pack data (`pack.calling-rules`, F1-15…F1-17; IN instance F1-36); everything above the floor — tone, topics including price talk, hand-over shaping, a narrower calling window, holidays — is the owner's. The shipped defaults are safe out of the box (guided, pre-filled; a free-text box so the owner is never boxed in). | `SRC` — `TC.principle.2`, `TC.principle.3` (journey L1171–1186 post-overlay, D36 as amended; the gate mechanism and enforcement are `modules/M07`'s; the ruleset data is F1's) | P0 |
| M01-57 | **Tenant configuration lists the agent & voice surfaces; their behaviour is specified in `modules/M07-sales-execution.md`.** The surfaces: **Agent setup — guided** (name · voice · languages · tone · opening line · what to say when it doesn't know · hand-over rules · calling window, within the floor · free-text "anything else") · **Opening line** (pre-filled disclosure, editable per its floor status) · **Hand-over rules** (editable list; the statutory opt-out is floor) · **Calling window** (days, hours, holiday calendar — narrower than the floor only) · **Business knowledge base** (structured, eight sections, seeded per market — never an empty page; the unanswered-questions one-tap loop) · **Test the agent** ("the most important screen here" — call yourself or run a typed conversation) · **Change history** (versioned config, kept quietly) · **Number provisioning** and **inbound call routing (IVR)** (UXG-16/UXG-17 — M07's slices). M01 owns their presence in the settings information architecture and the M01-28/M01-30 laws applying to them; M07 owns every behaviour. | `SRC` — `TC.agent-setup.1`–`.7`, `TC.kb.1`–`.11`, `TC.rec.1` (journey §Tenant configuration A/B — all shared dispositions: surface list here, behaviour `modules/M07`); `DOC00.tenant-config-scope` (Task 3 → this module) | P0 |

**Behavior detail.** This area is deliberately thin: it exists so the tenant-config surface
map is complete in one module and so M03/M06/M07/M11 can reference stable surface names
(§4). The knowledge base's seeded pack is market-pack content for its market-specific
sections (the IN seed's subsidy/net-metering content — F1's colour); the agent language set
is independent of UI languages (F3-29; M07 specifies the set). Test-the-agent and the
unanswered-questions loop are M07 requirements; their settings entry points live here.

Permissions: `F2.M01.configure-agent` (EPC Owner-only, per the v1 matrix carried by Task 5).

**Edge cases & what-goes-wrong** (carried at surface level; mechanics M07's):

- *Owner sets the agent to do something legally risky* (`TC.wrong.1`) → statutory items are
  **blocked by the gate** (calls outside the floor window, do-not-call-registry or opt-out
  violations); the opening-line wording stays owner-editable **within the four hard floors of
  the tiered disclosure law** — never claims human, never denies AI when asked, instant
  handoff, full transcription (owner ruling 2026-08-04, Q6; `M07-10`, `F1-36`(d)).
- *Knowledge base contradicts itself* (`TC.wrong.2`) → flagged on save (M07's validation).
- *Agent config changed mid-campaign* (`TC.wrong.3`) → config is versioned; calls already
  queued use the version they were queued with, and the owner is told (M07/D18).
- *Tone set to "Direct" but the knowledge is verbose* (`TC.wrong.7`) → the preview/test surface
  shows the mismatch before it goes live (M01-30's law; M07's test screen).

**Acceptance criteria.** Given the settings surface, when a tenant opens configuration, then
every surface named in M01-57 is present (or honestly absent per entitlement/market rules —
e.g. no outbound voice in a market with no voice ruleset, F1-16), each with a working default
(M01-28), and their behaviours are governed by `modules/M07` (M01-57). Given any agent-config
attempt that violates the market floor, when it is saved, then the gate blocks it with the
rule named (M01-56; enforcement M07).

**Localization notes.** Agent speech languages are M07's set (independent of UI, F3-29);
KB and template content is tenant data per language (F3-10). **Analytics events:** owned by
M07 (config version published, test run, KB answer promoted).

### M01.10 — Capture settings, locale defaults & integration credentials

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M01-58 | **Capture settings state honestly which lead channels are live.** A settings sub-surface shows every lead source with its real status: live channels toggleable; channels that do not exist yet rendered as **"later" cards, not teasers** — the screen must distinguish live from not-yet rather than advertise. Deferred sources are parked here. The channel set, its toggles' effect and the capture flows are `modules/M02-crm-and-leads.md`'s (with `modules/M03-marketing.md`'s brief-era channels recorded as a conflict by Task 3); this module owns the settings surface's existence and its honesty rule. | `SRC` — `DOC04.tenant-settings` ("which lead sources are live, capture config ('deferred sources parked here')"); `TC.lead-sources.1` (shared — channel policy `modules/M02`); `UXG-03` (cited — dispositioned by Task 13 per its ledger target) | P0 |
| M01-59 | **Locale defaults are tenant settings: the tenant's default language and the working calendar.** The default language governs customer-facing document defaults and new-invite default only — UI language is always per-user (F3-02, never overridden here). The calendar is the pack's holiday calendar (F1-21/F1-48) plus tenant-added holidays; tenant additions can only *narrow* calling availability, never widen past the floor (F1-17). The tenant timezone is tenant data (F1-10). | `SRC` — `DOC04.tenant-settings` ("locale (default language, holiday calendar)") | P1 |
| M01-60 | **Integration credentials are write-only, shown as last-4, probed, and never fail silently.** Tenant-supplied credentials (the BYO payment gateway of `modules/M11`; tenant-side messaging/voice credentials where M07 defines them) display last-4 only after entry; every platform decrypt is audit-logged; credentials are probed on a schedule and an invalid credential raises an alert plus a persistent settings nag — never silent failure. Credentials are the tenant's to rotate. | `SRC` — `DOC08.credentials-last4` (docs/engineering/08); `DOC09.credential-probe-nag` (docs/engineering/09) | P0 |

**Behavior detail.** Capture settings reuse the M01-28 default law (manual capture and the v1
source set work with zero setup; M02 owns which). The honesty rule on "later" cards is a
named requirement because the source screen as written over-promised (`S2.screen.5`'s ledger
note — M02 carries that key). Locale defaults never touch per-user language (F3's law);
holiday additions surface wherever scheduling reads the calendar (M07's calling window, M02's
snooze wake-ups — consumers, not owners). The credentials surface links each credential to
its owning module's connect flow (M11 gateway connect; M07 number/BYO flows) — M01 provides
the one place to see credential health.

Permissions: `F2.M01.manage-tenant-settings` (EPC Owner). Credential lifecycle events and
every decrypt are audit entries (F2-22).

**Edge cases & what-goes-wrong.** *A not-yet channel is toggled on* → cannot happen; later
cards carry no toggle (M01-58). *Credential expires or is revoked at the provider* → the probe
catches it; alert + nag until rotated; dependent surfaces state the failure honestly rather
than erroring blind (M01-60; `DOC09` status-honesty). *Tenant adds a holiday mid-campaign* →
scheduling consumers re-read the calendar; queued work respects its queued rules (M07's
versioning — `TC.wrong.3` pattern).

**Acceptance criteria.** Given the capture-settings screen, when it renders, then every live
channel shows a working toggle and every not-yet channel is a "later" card with no toggle
(M01-58). Given a stored credential, when any settings surface renders it, then at most last-4
is visible and no read-back exists (M01-60). Given a failing credential, when the scheduled
probe detects it, then an alert fires and a settings nag persists until rotation (M01-60).

**Localization notes.** Channel names and later-card copy translated per F3; holiday names
from the pack calendar render per pack labels. **Analytics events:** channel toggled ·
later-card viewed · credential added / rotated / probe-failed · holiday added / removed.

## 4. Cross-module contracts

**This module provides:**

- **The tenant-config surface names** referenced suite-wide (design-spec interface): *Catalog ·
  Price book · Branding · Proposal templates · Payment terms · Message templates · Capture
  settings · Locale defaults · Integration credentials · Agent & voice setup (pointer)* — the
  stable vocabulary M03/M06/M07/M11 cite.
- **To M05/M06 (the DD12 picker):** the resolved catalog (M01-32), unified search + filters
  (M01-38), scheme-keyed certification badge data (M01-34), provenance labels (M01-35), the
  three inline-add paths invocable in-flow (M01-39…41), archive semantics (M01-42), release
  labels for pinning (M01-43) and versioned rates (M01-44, M01-48). M06's Generate-time
  compliance gate consumes scheme data via F1 (F1-34's rule shape); M05's out-of-stock
  flagging consumes archive state.
- **To M06:** tenant document defaults — proposal template, T&C, bank details, timeline
  template, default tranche template, message templates — including everything Quick mode
  fills (M01-53/R11 half); branding for rendered documents (M01-50).
- **To M11:** tranche templates and the tenant default (M01-54); the connected BYO gateway
  credential's health (M01-60). M11 owns the money path they feed.
- **To M07:** the agent & voice settings surface map and its governing principle (M01-56/57);
  locale/holiday calendar data consumers read (M01-59); credential health for voice/messaging
  rails (M01-60).
- **To M02/M03:** the capture-settings surface and its honesty rule (M01-58).
- **To M12 / `04-business-model.md`:** a signup free of billing steps (M01-11); the tenant and
  user objects billing attaches to.
- **To M13:** the first-run handoff onto role homes (M01-17); demo-project exclusion from
  reports (M01-27).
- **To F6:** the two invite events this module's edge list raises — invite declined, re-invite
  requested on an expired invite (M01-19) — registered in `foundations/F6` §F6.3's matrix, which
  cites that edge list. *(Pointer added by Task 26 for hand-off symmetry, per the Task 23
  report's closure note — M01 §4 predates the F6 registration convention.)*
- **To F2:** the Team / Assign roles / Roles reference / Invite screens rendering F2's
  semantics (M01-19…21) — F2 owns the truth; this module owns the screens.

**This module expects:**

- **From F1:** pack keys and market data — `pack.tax` registration types/formats (M01-24/25),
  `pack.certification-schemes` (M01-34), `pack.formats` (phone spec, calendars, formats —
  M01-03, M01-59), `pack.calling-rules` floor (M01-56), market demo content as pack content
  (M01-27; placement ruled 2026-08-04, Q19).
- **From F2:** the twelve presets, matrix rows `F2.M01.*`, guard rails F2-19/20/21, audit law
  F2-22.
- **From F3:** per-user language law, template content classes, money/number rendering.
- **From F8:** provenance surfacing, pinning/staleness laws (F8-13…15), and the standing
  instruction that no tenant-config switch weakens an honesty law (F8-06) — binding on every
  surface this module defines.
- **From M02:** quick-add and the teaching empty Leads screen behind M01-26's first door.
- **From M05:** a demo project whose design opens in the studio (M01-27's "safest place to
  learn").

## 5. Non-goals

- **No SSO in v1** (`S0.notv1.2` — still stands post-overlay). Recorded exclusion; enterprise
  auth is a future decision.
- **No custom domains in v1** (`S0.notv1.3`). Rationale, source-derived: custom domains are
  **Enterprise white-label packaging**, not a withheld v1 capability — the routing is designed
  at `foundations/F5` (`F5-81`–`F5-83`) and the commercial placement is `BM-15`'s (`CG-18`);
  no tenant-facing domain-configuration surface exists in this release.
- **No automatic OTP channel fallback (owner ruling 2026-08-06, Q47).** SMS is the delivery
  channel and the system retries nothing behind the user's back; the recovery path is the
  user's own — the **resend** control unlocking at 30 s (M01-04) and the user-initiated **"call
  me instead"** voice OTP, which is retained precisely because the user asks for it. Owner's
  words: "keep only resend feature after 30s that button get enabled, and the system should not
  use any fallback mechanism." The automatic secondary-channel fallback `M01-03` previously
  carried — and the half of `DOC07.otp-delivery` that specified it — ship nowhere; the citation
  survives for the row's other halves and is marked superseded in-row rather than deleted.
  "No silent degradation on the front door" is **strengthened** by this exclusion, not weakened:
  a delivery failure is now always a loud, plain retry-later message — and where that failure is
  a **confirmed hard** one, the resend cooldown releases immediately so the user can act on the
  message at once, with the user-initiated "call me instead" voice OTP offered in the same state
  (owner ruling 2026-08-06, Q51). That release is not a bypass of anything: **M01-04's
  anti-abuse caps are unchanged and still bind**, and a cap already reached governs the state
  instead, honestly stated. *(The Q51 clause is added by owner ruling 2026-08-06; this bullet
  previously ended at "a loud, plain retry-later message." and said nothing about when the user
  could act on that message.)*
- **No billing surfaces in this module** — no plan pick, no payment step, no trial UI at
  signup (M01-11); all of it is M12's, by design (OD-4 scope, `BM-28` no-card trial).
- **No custom roles, no role editor, no per-person exceptions** — F2's law (F2-02, F2-15,
  F2-16); this module ships role *assignment* surfaces only (`TC.roles.1` post-overlay).
- **No discount limits or approval configuration** (`TC.discount-limits.1`: "Not in this
  release — no approval, no ceiling (D34). Reserved for when a tenant asks for per-rep
  limits."). The only guard is arithmetic at Generate (M06's D34/R12 mechanics).
- **No tenant catalog request queue** — considered during V2 design (a request-queue flow was
  proposed) and **deliberately rejected** in favour of self-serve with provenance labelling
  (DD9, design spec §9): a queue makes the platform a bottleneck for a tenant's ability to
  quote, and every rival that routes missing components through support queues demonstrates
  the failure mode (design spec §10). Platform-book population is internal ops (M01-46).
- **No partner-funded placement, sponsored ranking or distributor pay-to-play in the catalog**
  (`CG-13`, SKIP-DELIBERATELY): "The two-tier catalog's neutrality is a trust wedge with
  EPCs. If ever revisited, only as clearly-labelled sponsored listings — never silent
  ranking." Carried as product law for every catalog surface this module defines.
- **No tenant restyling of the operator app** — branding is customer-documents-only (F7-07;
  M01-50).
- **No tenant switch that weakens number-honesty** — provenance labels, staleness states and
  indicative labelling are platform behaviour, never configuration (`TC.principle.4` half;
  the law is `F8-06`). No template, branding or agent setting this module defines may offer
  such a switch.
- **No send channel, and no sending surface, in this module** — the templates M01-55 defines are
  authored here and sent elsewhere. The composed message **sends from the tenant's connected
  transactional channel where one exists, and is copy-paste for a person to send where none is**
  (owner ruling 2026-08-04, Q33 — `M03-03`); only that fallback path claims no delivery (D32's
  surviving discipline). Connecting a channel, the campaign lane and every delivery state are
  `modules/M03`'s surface; the consuming flows are `modules/M06`'s and `modules/M07`'s. This
  module owns the template-settings surface and no part of the send. *(This bullet previously
  read "**No WhatsApp/business-messaging sending from this module's templates** — v1 source
  model is compose-for-copy-paste (D32, M06's flow); the brief-era marketing channels are M03's
  surface with the conflict already recorded (Task 3)" — the retired manual-only rule stated as
  the current model, contradicting M01-55's own reconciled row in §M01.8; aligned here, as every
  sibling module's §5 already is — see `registers/conflicts.md` row 4, which carries the
  resolution.)*

## 6. Open questions

Mirrored into `registers/open-questions.md` (rollup ids noted):

- **M01-Q1 (register Q18) — RESOLVED (owner ruling 2026-08-04, Q18).** Google Login is a
  **convenience sign-in bound to the same phone-identity account**: the phone remains the
  identity, no duplicate accounts are ever created, and the linking flow runs at the first
  Google sign-in (M01-02). Signup completes phone verification as part of becoming an account;
  Google never substitutes for it.
- **M01-Q2 (register Q19) — RESOLVED (owner ruling 2026-08-04, Q19).** Every market pack ships
  **one demo project as pack content** (IN: the Pune-class rooftop, M01-27) — versioned with
  the pack per `F1-11`, beside the eight rules keys rather than as a ninth key (`F1-02` notes
  the placement). The KB seed pack rides the same pack-content family.
- **M01-Q3 (register Q20) — RESOLVED (owner ruling 2026-08-04, Q20).** The auth-rebuild parity
  laws (`UXG-PAR-02`–`05`) are **carried as written into the rebuild acceptance list**: (a)
  signed-out routing decided once for both platforms; (b) the success-dwell timing; (c) the
  explicit connectivity contract for OTP submission; (d) visible resend
  feedback on every platform. The rebuild answers all four against that list; none is left to
  per-platform improvisation.
- **Register Q44 — RESOLVED (owner ruling 2026-08-06, Q44).** The OTP resend cooldown
  is **30 seconds** — the value `S0.wrong.2` already promises the user; `DOC08.otp-limits`'
  45 s is superseded (M01-04). Every other anti-abuse limit is unchanged. *(The clause that
  followed — "and `M01-03`'s layered delivery path, are unchanged" — was true of Q44 and is
  overtaken by owner ruling 2026-08-06 (Q47): that layered path no longer exists, its automatic
  secondary-channel fallback having been removed. Q44's own scope, the cooldown's value, is
  untouched by Q47.)* *(This bullet previously read "**In-row tension (no new question):** OTP
  resend 30 s (`S0.wrong.2`) vs 45 s cooldown (`DOC08.otp-limits`) — recorded at M01-04 for the
  closure pass" — the tension it described is closed, so it can no longer stand as an open
  divergence; `registers/conflicts.md` row 9 is settled by the same ruling.)*
- **Register Q47 — RESOLVED (owner ruling 2026-08-06, Q47).** There is **no automatic OTP
  channel fallback**, so the timer collision this question described cannot occur: only one
  timer remains, the 30 s resend unlock (M01-04). Owner's words: "keep only resend feature after
  30s that button get enabled, and the system should not use any fallback mechanism." SMS is the
  delivery channel; the user's **resend** control unlocks at 30 s and the user acts; the
  user-initiated **"call me instead"** voice OTP is **retained** (it is the user's act, never a
  system fallback); every M01-04 anti-abuse limit is unchanged; and a delivery failure fails
  loudly with a plain retry-later message (M01-03). *(This bullet previously read "**New question
  raised by the Q44 closure — OPEN, needs a register id.** With the resend cooldown ruled at
  30 s, it now expires at the same instant as `M01-03`'s automatic channel-fallback timer
  (“delivery failure or a 30 s timeout”). Under the superseded 45 s value the two were ordered —
  fallback first, resend after — and the ordering was never stated because it fell out of the
  numbers. What the user sees at t=30 s when both land together (fallback fires *and* resend
  unlocks) is not decided by Q44 and is **not decided here**: M01-03 and M01-04 each stand as
  written. Raised by the Q44 closure pass for the owner." — the ruling removes the fallback timer
  that was one half of the collision, so the question has no subject left. Any annotation
  anywhere still describing it as open is false as of 2026-08-06.)*
- **Register Q51 — RESOLVED (owner ruling 2026-08-06, Q51).** A **confirmed hard delivery
  failure releases the resend cooldown immediately**: the moment the SMS rail reports a hard
  failure, the 30 s cooldown is released and the user may act at once, and the user-initiated
  **"call me instead"** voice OTP is offered in that same state (`M01-03`, `M01-04`). The
  rationale the owner accepted: the cooldown exists to stop resends while a message is still in
  flight, and once the network confirms failure nothing is in flight. The release is of the
  cooldown only — **the anti-abuse caps are unchanged and still apply** (3 requests per 15 min,
  8 per day per phone, 5 failed verifies invalidate, 3 invalidations lock for 15 min); where a
  cap is already reached the cap still governs and the honest message says so. The 30 s value
  itself (Q44) is untouched for the ordinary in-flight case. *(This bullet previously read "**New
  question raised by the Q47 closure — OPEN, needs a register id.** With the automatic fallback
  removed, a **hard SMS delivery failure reported before t=30 s** has no stated behaviour for the
  resend control: `M01-03` says the login fails loudly with a plain retry-later message, while
  `M01-04` holds the resend control under its 30 s cooldown — so it is not stated whether the
  loud-failure state releases that cooldown early (the user's only remaining recovery becoming
  usable at once) or whether the user waits out the 30 s before the retry-later message can be
  acted on, nor whether "call me instead" is offered immediately in that state. The removed
  automatic fallback covered exactly this 0–30 s window, which is why the question could not
  arise before. **Not decided here** — the ruling settled that no fallback exists, not the
  cooldown's behaviour inside the failure state; `M01-03` and `M01-04` each stand exactly as
  amended, and no task or brief invents an answer. Raised by the Q47 closure pass for the owner."
  — the ruling decides exactly what that question asked. Any annotation anywhere still calling
  it open is false as of 2026-08-06.)*
- **New question raised by the Q51 closure — OPEN, needs a register id.** The confirmed-hard-failure
  state now carries two things the PRD words in opposite directions: `M01-03` says that failure
  "fails loudly with a plain **retry-later** message", while the ruling makes the retry available
  **immediately** in that same state (resend released, voice OTP offered). What the message
  actually says is therefore unstated — whether the loud-failure copy keeps its retry-*later*
  framing while a live resend control sits beside it, or whether the copy names the now-available
  act and the state's very name (`delivery-failed-retry-later`, `docs/ux/briefs/SCR-M01-01-sign-in.md`)
  follows. **Not decided here** — Q51 settled *when the user may act*, not *what the failure
  message says*; `M01-03`'s "retry-later" wording and the brief's state name each stand exactly as
  written, and no task or brief invents a replacement. Raised by the Q51 closure pass for the
  owner.
- **Dependent surfaces outside this module, recorded not edited (Q51 application, 2026-08-06).**
  Searched, as the ruling's application requires: **no PRD document outside M01 states behaviour
  for the OTP resend cooldown or the delivery-failure state** — the cooldown is `M01-04`'s and
  the failure state is `M01-03`'s, and `F1-43`/`F1-18`(c) (OTP delivery as one vendor-neutral
  rail capability) and `foundations/F5-customer-link.md`'s `F5-44` (OTP-at-accept) consume the
  delivery capability without referencing a cooldown. What **does** still carry pre-ruling text,
  in files this module does not own: `registers/open-questions.md`'s `Q51` row (still typed
  **Open**, "awaiting an owner ruling") and that register's narrative describing `Q51` as
  unresolved. `registers/conflicts.md` row 9 and `registers/screens.md`'s `M01-04` row are
  untouched by this ruling — row 9 is the 30 s/45 s divergence Q44 closed, and the screens row's
  non-UI note names the caps and the cooldown without stating failure-state behaviour. Each is
  its own owner's act; recorded here, not performed.
- **Dependent surfaces outside this module, recorded not edited (Q47 application, 2026-08-06).**
  Searched, as the ruling's application requires: **no PRD document depends on the OTP rail
  providing a secondary/fallback channel.** `F1-43` declares OTP delivery as one vendor-neutral
  capability with a v1 reference implementation and requires no second channel; `F1-18`(c) lists
  OTP delivery among a pack's reference rail adapters with no fallback clause; and
  `foundations/F5-customer-link.md`'s `F5-44` (OTP-at-accept, default OFF per Q42) consumes that
  same single delivery capability — nothing there is weakened by Q47. What **does** still carry
  pre-ruling text, in files this module does not own: `registers/open-questions.md` `Q47` (still
  typed **Open**); `registers/conflicts.md` row 9 (still states "as is `M01-03`'s layered
  delivery path (SMS → fallback channel → voice OTP)" and points at `Q47` as an open new
  question); `registers/screens.md`'s `M01-03` row (non-UI note still reads "layered OTP delivery
  rail: SMS primary, auto fallback channel on failu…"); and the retired traceability register's
  `DOC07.otp-delivery` row (typed `live` → `M01-03`, whose automatic-fallback half is now
  superseded). *retired: docs-rules ledger*'s `DOC07.otp-delivery` row is extracted source
  and is rewritten by nobody. Each is its own owner's act; recorded here, not performed.
- **Resolved elsewhere (no new question):** the AI-disclosure question
  (register **Q6**) was resolved 2026-08-04 by the tiered disclosure law (`F1-36`(d), `M07-10`)
  — M01-56's edge case now defers to the resolved law.
