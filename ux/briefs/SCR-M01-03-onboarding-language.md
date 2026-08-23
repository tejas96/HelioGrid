# SCR-M01-03 · Onboarding — Language

First-run language choice; each language listed in its own script and name; defaults to device language.

**Module:** M01 · **Personas:** All personas · **Context of use:** first run, on both platforms — this is the moment a new user's language is most likely wrong (F3 §F3.1 behavior detail). The personas most likely to work in Hindi or Marathi — Survey Engineer, Field Technician, Installation Team Member — are the personas who live on the phone (F3 §2), so this step is mobile-first in practice. Language is a per-user setting; no tenant configuration sets or restricts it (F3-02 context).

## Entry & exit

Reached from: onboarding on first run (F3-03) — for both the signing-up owner and an invited employee's first sign-in ("a user has no language preference recorded yet… the picker is the first-run step that resolves it" — F3 §F3.1 edge list). Its exact position inside the onboarding sequence is not pinned by PRD — designer decides, note the decision. Leads to: the rest of onboarding; the same picker lives permanently in Profile & Preferences (SCR-M01-11).

## Requirements (verbatim)

### From `prd/foundations/F3-localization.md`

- **F3-03** (P0) — **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set.

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **device-language-default** — the device's language is in the set, so the picker defaults to it and the app renders in it without the user's intervention (F3-03; F3 §F3.1 acceptance).
- **device-language-not-in-set** — the picker defaults to English and stays fully available; the user is never blocked from choosing among the languages that do exist (F3 §F3.1 edge list).

## Data volume

The launch language set: three languages (English, Hindi, Marathi — F3-01 context), each listed in its own script and name. The picker's own labels are translated, but the language names inside it are not, and the picker must remain legible when it lists a script the current language does not use (F3 §F3.1 localization notes). Nothing in the product may assume the size of the set — it is expected to grow (F3-01 context).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
