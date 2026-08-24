# SCR-M01-11 · Profile & Preferences

Permanent per-user language picker and measurement-unit preference.

**Module:** M01 · **Personas:** All personas — with special weight on Survey Engineer, Field Technician, Installation Team Member (the personas who live on the phone and are most likely to work in Hindi or Marathi — F3 §2) and Sales Executive; all staff · **Context of use:** every user's own settings, reachable by every persona on both platforms — "from More → Profile (mobile) and the sidebar (desktop)" (F3-03 source pointer). Field personas reach for the high-contrast field mode here while working outdoors on a phone in direct sun (F7-16). Everything on this screen is per-user: no tenant configuration, admin action or plan tier sets or restricts it (F3-02 context; F7-16; F6-15).

## Entry & exit

Reached from: More → Profile (mobile) and the sidebar (desktop) — per F3-03's source pointer. Leads to: nowhere in particular — changes apply in place; switching language re-renders the whole application immediately with no reload and no loss of in-progress work (context: F3 §F3.1 / F3-04, not a row of this slice). Exit is not otherwise pinned by PRD — designer decides, note the decision. The user's own role card (SCR-M01-10) is re-openable from here (M01 §M01.2 permissions).

## Requirements (verbatim)

### From `docs/prd/foundations/F3-localization.md`

- **F3-03** (P0) — **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set.
- **F3-23** (P1) — **Measurement units follow a per-user preference where the market offers one, with one fixed exception: procurement quantities stay metric regardless.** The preference sits beside the language setting on the same per-user basis (`F3-02`); the market's default is pack data (`F1-21`). Ordering, BOM and supplier-facing quantities are unaffected by the preference — they are metric in every case, for every user. _(non-UI half, build-side: procurement, BOM and supplier quantities stay metric regardless of preference — for awareness, not for drawing)_

### From `docs/prd/foundations/F6-notifications-and-search.md`

- **F6-15** (P2) — **Per-user notification preferences are minimal and honest:** a user may mute push per type-group (never the in-app record, never audit-relevant billing/compliance events for the Owner); no per-event snooze theatre. The record always lands (F6-06). _(non-UI half, build-side: in-app record always lands; owner billing/compliance push never mutable — for awareness, not for drawing)_

### From `docs/prd/foundations/F7-design-language.md`

- **F7-16** (P1) — **A high-contrast field mode exists as a sanctioned, opt-in escape hatch for working in sunlight.** It is a product-visible capability, not a styling variant: a user working outdoors can turn it on and get a legible interface on a phone screen in direct sun, and turning it on is the one condition under which the no-borders law of `F7-15` yields. It is opt-in and per user; it is not a theme, not a tenant setting, and not the light/dark switch that `F7-04` excludes. _(non-UI half, build-side: sanctioned exception to no-borders law; per-user preference, never a tenant setting or theme — for awareness, not for drawing)_

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **normal** / **default** — language picker (each language in its own script and name — F3-03), measurement-unit preference beside it (F3-23), notification push mutes per type-group (F6-15), field-mode toggle (F7-16).
- **language-switched-rerender** — changing language re-renders the whole application immediately, no reload, no loss of in-progress work (context: F3 §F3.1 / F3-04, not a row of this slice; the slice names this state).
- **field-mode-off** — the default; the standard design language holds.
- **field-mode-on** — the opt-in high-contrast field mode active: legible on a phone screen in direct sun; the one condition under which the no-borders law yields (F7-16). Per user and reversible (F7 §edge list).
- **type-group-muted** — a push type-group muted by the user; the in-app record still always lands (F6-15).
- **protected-types-locked** — audit-relevant billing/compliance events for the Owner are never mutable; the control shows they cannot be muted (F6-15).

## Data volume

Three launch languages (English, Hindi, Marathi — F3-01 context), each in its own script; the picker must remain legible when it lists a script the current language does not use (F3 §F3.1 localization notes). One two-value measurement preference (m/ft — F3-23 source pointer) whose market default is pack data. Push mutes per type-group — a short list of type-groups, not per-event controls ("no per-event snooze theatre" — F6-15). One field-mode toggle.

## Numbers carrying provenance

None — this screen shows no user-visible money, business quantity or business date. (The measurement preference changes how measurements render elsewhere; procurement, BOM and supplier-facing quantities stay metric in every case — F3-23.)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
