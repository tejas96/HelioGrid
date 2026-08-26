# MS12 · Studio shell — wizard, dashboard, persistence, UI kit

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 11 rulings, 2026-08-05) · Depends on: F2 (roles), F3 (languages), F4 (data integrity), F7 (design system, a11y), M01 (auth per Q18), M02 (leads), MS6/MS10 (health, BOM), MS11 (fingerprints, duplicate)
Sources: POC code inventory — shell (**131 keys**, 11 test files / 120 tests passing) · sitting rulings (S11-1…S11-3) · census A.10-1. The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: every studio document consumes this shell's navigation, gates, persistence and UI kit.

## 1. Purpose & scope

The shell is everything around the design: the step wizard with its gates and help, the design list, sign-in, autosave and storage resilience, the shared UI kit, and the accessibility floor. The POC built it as a browser-local prototype; S11-3 makes it platform-native.

## 2. Personas & surfaces

All studio personas (F2). Web primary, mobile parity (F7-30). Accessibility is a gate, not a polish item (MS12-25).

## 3. Feature areas

### MS12.1 — The wizard

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS12-01 | NINE visible steps with no phantom step and no reachable dead step URL; the progress bar reads "Step n of 9"; internal step ids stay stable so existing designs open unchanged (S11-1 fixes `.1/.2`, census R7). | `BRIEF` S11-1 | P0 |
| MS12-02 | Navigation clamps to valid steps and remembers where a design was left (`.3`); deep links are gated by prerequisites — you cannot jump past an unmet gate (`.4`). | `SRC-CODE` | P0 |
| MS12-03 | Per-step Next gates state their reason in plain language, in a defined order: setup completeness · at least one roof · panel/inverter/capacity · at least one enabled panel · the electrical hard gate (error-level electrical issues block and clamp the reachable steps, MS8-33); steps without gates say so by simply proceeding (`.5–.9`). | `SRC-CODE` | P0 |
| MS12-04 | A blocked Next explains itself in an accessible, non-blocking toast (`.10`). | `SRC-CODE` | P0 |
| MS12-05 | Header: back, step title, health chip, units toggle, save, save-and-exit, help, and the primary action (Next / Done) (`.11/.12/.18–.21/.24`); "save and exit" returns to the LEAD the design belongs to (S11-3d fixes `.20`). | `SRC-CODE` + `BRIEF` S11-3d | P0 |
| MS12-06 | Design Health chip reads the stamped snapshot, shows a provisional state while shading recalculates, and shows a neutral placeholder before any score exists; bands and weights come from the rules pack (`.13–.17`, F1). | `SRC-CODE` | P0 |
| MS12-07 | Per-step help: one plain-language "what this step does" plus tips, one entry per step, reachable from the header (`.21–.23`). | `SRC-CODE` | P0 |
| MS12-08 | Progress indicator reflects the true step count (MS12-01) (`.25`); canvas steps use the dark editor theme (`.26`); step routing maps each step to its screen (`.27`). | `SRC-CODE` | P0 |
| MS12-09 | Health sheet: provisional banner, per-category cards with plain-language deductions, a "what changed" delta, unscored context lines, and a provenance footer explaining how the total is computed (`.28–.33`, F8). | `SRC-CODE` | P0 |

### MS12.2 — Design list & entry

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS12-10 | Design list is LEAD-SCOPED and server-backed: designs belong to a tenant and a lead, open on any device for any permitted teammate (S11-3b/d) (`.38/.39/.45`). | `BRIEF` S11-3 | P0 |
| MS12-11 | List controls: live counts, status filters, search across name/customer/address, and sort by recency or name (`.38/.40–.42`). | `SRC-CODE` | P0 |
| MS12-12 | Design cards: real buttons with keyboard support, satellite thumbnail of the confirmed pin, status chip, capacity/updated stats, and an actions menu (open · duplicate · delete) with correct menu semantics (`.44/.46–.50`). | `SRC-CODE` | P0 |
| MS12-13 | Opening a design resumes at its saved step with a clean undo history (`.45`, MS11-26). | `SRC-CODE` | P0 |
| MS12-14 | Delete asks for confirmation and states accurately what is removed and from where (S11-2.2 fixes `.51`). | `SRC-CODE` + `BRIEF` S11-2 | P0 |
| MS12-15 | Empty state invites the first design (`.43`); a data-integrity banner surfaces any design that could not be loaded, rather than hiding it (`.34`). | `SRC-CODE` | P0 |
| MS12-16 | New-design defaults are explicit and market-aware (`.57`, F1); a design's share identity is created with it (`.58`, MS9-09 governs its lifecycle). | `SRC-CODE` | P0 |

### MS12.3 — Sign-in, tenancy & languages

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS12-17 | Sign-in is the PLATFORM's: mobile OTP and Google (Q18), establishing tenant, user and role context (F2) — replacing the POC's mock two-phase login (S11-3a fixes `.52–.56`); no dead controls (S11-2.1 fixes `.55`). | `BRIEF` S11-3a/S11-2 | P0 |
| MS12-18 | Languages are the platform's real catalogs — EN/HI/MR at launch (F3) — not a placeholder list (S11-3c fixes `.37`); the user's language and unit preferences persist per user (`.18/.72`). | `BRIEF` S11-3c | P0 |
| MS12-19 | Sign-out clears session state without destroying work (`.36`); brand and tenant identity appear in the top bar (`.35`, M01 branding). | `SRC-CODE` | P0 |

### MS12.4 — State, autosave & resilience

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS12-20 | Designs are stored SERVER-SIDE as the system of record (S11-3b). The POC's resilience behaviours are retained where they still help: debounced autosave, flush on exit, failure surfacing, quarantine of unreadable records, migration that never loses data, and image garbage collection (`.65–.70/.73–.83/.94–.97`). | `BRIEF` S11-3b + `SRC-CODE` | P0 |
| MS12-21 | Undo model: whole-design snapshots scoped to the open design, cleared on switch, with restore semantics that keep multi-device ordering sane (`.59–.61`, MS11-26). | `SRC-CODE` | P0 |
| MS12-22 | Concurrent editing is handled honestly: an external change to the same design is detected and surfaced rather than silently overwriting (`.63/.64/.82/.109`); the POC's last-writer-wins local rule is superseded by the platform's conflict handling (S11-3b). | `SRC-CODE` + `BRIEF` S11-3b | P0 |
| MS12-23 | Every persisted design is normalised and repaired on load — weather validity, pricing clamps, calibration sanity, entity-array coercion, roof/segment defaults, BOM override shape — so a malformed record can never crash a screen (`.84–.93`). | `SRC-CODE` | P0 |
| MS12-24 | Save state is always visible: a persistent "not saved" alert when writes fail, and the design never silently loses work (`.70/.108`). | `SRC-CODE` | P0 |

### MS12.5 — UI kit, accessibility & routing

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS12-25 | Accessibility is a shipped gate: automated checks run over the rendered kit and screens, focus is trapped and restored in sheets/dialogs, Escape closes, and every control carries a real role and name (`.115–.118/.130`, F7). | `SRC-CODE` | P0 |
| MS12-26 | Shared controls behave identically everywhere: sliders with stepper buttons, switches, segmented radiogroups, option cards, unit toggle, number and text fields that COMMIT ONCE on blur or Enter (never per keystroke), accessible tables with required captions, screen-reader-only text, and empty states (`.119–.129`). | `SRC-CODE` | P0 |
| MS12-27 | Routing: named routes for the wizard, design list, share and sign-in, with guards applied after hydration and a hydration gate that shows loading rather than a blank screen (`.102–.106`, MS9-15); legacy dead routes are removed (S11-2.3 fixes `.102/.83`). | `SRC-CODE` + `BRIEF` S11-2 | P0 |
| MS12-28 | Background recompute hosts recompute shading and health at the shell level, stamping the fingerprint of the geometry actually used — never a newer one (`.107/.113/.114`, MS11-21). | `SRC-CODE` | P0 |
| MS12-29 | The living design-system reference stays part of the product's development surface (`.112`, F7 binding). | `SRC-CODE` | P1 |
| MS12-30 | Drawing projections (isometric, elevation, fit-to-box preserving aspect, member projection) are shared by every drawing surface (`.98–.101`, MS8/MS6). | `SRC-CODE` | P1 |

## 4. Cross-module contracts

Consumes: M01 auth/branding, F2 roles, F3 languages, F4 concurrency law, F7 design system + a11y, M02 leads, F1 rules pack. Provides: navigation and gates to every studio step (the electrical hard gate surfaces here per MS8-33), persistence and undo to all screens, the UI kit and accessibility floor, and the health chip/sheet.

## 5. Non-goals

Browser storage as the system of record (MS12-20) · mock authentication (MS12-17) · dead controls or routes (MS12-14/27) · per-keystroke commits in shared fields (MS12-26).

## 6. Open items

None — Sitting 11 closed with zero open items (3 rulings, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given a deep link to a step whose prerequisites are unmet, Then navigation clamps to the highest permitted step and says why; and reopening a design returns to where it was left (MS12-02).
- Given a failed save, Then a persistent alert states the design is not saved and no work is silently lost (MS12-24).
- Given the wizard, Then nine steps are shown and no dead step URL resolves, while existing designs still open at their saved step (MS12-01); each gate states its reason in order (MS12-03) and a blocked Next explains accessibly (MS12-04); the header carries all controls and "save and exit" returns to the lead (MS12-05); the health chip shows stamped, provisional or placeholder states correctly (MS12-06); help exists for every step (MS12-07); progress reflects nine steps (MS12-08); the health sheet explains its score with deltas and context (MS12-09).
- Given a tenant user, Then the design list shows that tenant's lead-scoped designs on any device (MS12-10) with counts, filters, search and sort (MS12-11); cards are keyboard-operable with correct menus (MS12-12); opening resumes at the saved step with clean undo (MS12-13); delete confirms accurately (MS12-14); empty and unreadable-record states are honest (MS12-15); new designs get market-aware defaults and a share identity (MS12-16).
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19).
- Given any edit, Then it saves server-side, surviving refresh, device change and a failed write with a visible alert (MS12-20/24); undo is scoped to the open design (MS12-21); a concurrent edit is surfaced, never silently overwritten (MS12-22); a malformed stored design is repaired rather than crashing (MS12-23).
- Given any sheet or dialog, Then focus traps and restores, Escape closes, and automated accessibility checks pass (MS12-25); shared fields commit once on blur or Enter (MS12-26); routes guard after hydration with a loading state and no legacy dead routes (MS12-27); background recompute stamps the geometry actually used (MS12-28).

Localization: all shell copy via catalog (F3). Analytics: step_navigated {from,to,blocked?}, design_opened, design_created/duplicated/deleted, save_failed {reason}, help_opened {step}.
