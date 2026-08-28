# SCR-M01-03 · Onboarding — Language

First-run language choice; each language listed in its own script and name; defaults to device language.

**Module:** M01 · **Personas:** All personas · **Context of use:** first run, on both platforms — this is the moment a new user's language is most likely wrong (F3 §F3.1 behavior detail). The personas most likely to work in Hindi or Marathi — Survey Engineer, Field Technician, Installation Team Member — are the personas who live on the phone (F3 §2), so this step is mobile-first in practice. Language is a per-user setting; no tenant configuration sets or restricts it (F3-02 context).

## Entry & exit

Reached from: onboarding on first run (F3-03) — for both the signing-up owner and an invited employee's first sign-in ("a user has no language preference recorded yet… the picker is the first-run step that resolves it" — F3 §F3.1 edge list). **Decided in design 2026-08-28: this is the first step of onboarding proper — the first screen after identity exists.** For a signing-up owner, immediately after the company is created on `SCR-M01-02`; for an invited employee, immediately after their first successful sign-in on `SCR-M01-01`. The reason is structural: language is a **per-user** setting (`F3-02`), so there is no user to record it against until identity is established. **It has no back control** — the step behind it is authentication, and returning there would mean signing out. Leads to: the rest of onboarding; the same picker lives permanently in Profile & Preferences (SCR-M01-11).

**Further decisions made in design (2026-08-28) — later screens inherit them.**

1. **The ghost language control in `SCR-M01-01` and `SCR-M01-02` chrome is not this picker, and does not duplicate it.** Before onboarding the app runs on the device's language with nothing saved, and that control exists for a shared field phone. **This screen is the one that records the preference.** Once recorded, the permanent home is Profile & preferences (`SCR-M01-11`), which this screen names in words.
2. **Choosing applies immediately; Continue only moves on.** No Save control — the screen redrawing in the language just touched is the only honest confirmation that the choice took, and it is the same behaviour `device-language-default` describes.
3. **The device default is stated, not merely pre-selected.** A ring and a filled dot say *this is chosen*; they cannot say *and you did not choose it*. So the device's language carries a word in a neutral pill — deliberately never the accent that selection uses. Two channels, both persistent content, neither a colour alone.
4. **No count of the set, anywhere.** Nothing may assume the size of the language set and it is expected to grow, so no copy says how many languages there are. Growth is answered structurally: the list is the scroll region and the primary sits below it.
5. **No step counter and no `Stepper`.** The onboarding sequence's length is not pinned by the PRD, so a counter would put a number on screen that nobody has decided — a transcription with no honest provenance.
6. **A loading placeholder may under-promise and must never over-promise.** Content that grows pushes down harmlessly inside the scroll region; content that shrinks pulls the primary up under a thumb already travelling toward it. No card is drawn for the device's own language — knowing the phone is set to English is not knowing that English is offered.
7. **`empty` means *nothing to choose between*, not *nothing arrived*.** The second is a failure and already has the error frame. Onboarding **skips this step when there is nothing to choose** — the frame exists because a step that can render must be specified, not because a user should meet it.
8. **The error is a corridor, not a wall.** Two full-size routes, the second being *carry on in the language already on screen*. It names no connection: a lost connection is the one shared full-screen surface the design system owns, and answering it here would be offline residue.
9. **No flag ever stands in for a language.** A flag is a country. It is the classic character-as-icon substitution `F7-19`/`F7-42` exists to stop.

**Build note — design-system gaps this screen found** are recorded once, in `packages/ui/CLAUDE.md` §"Known component gaps", which loads when anyone opens that folder. A screen brief is the wrong home for them: nobody building a component reads one.

1. **The type stack named no Devanagari face — half fixed 2026-08-28, half still open.** `--font-sans` was `"Geist","Inter",…` and Geist has no Devanagari coverage, so हिन्दी and मराठी rendered in whatever the operating system supplied. This is `F3-13`'s own words — *never through the operating system's fallback* — and the face was already chosen by owner ruling `Q14`: Noto Sans Devanagari. **Fixed for web:** the face is declared in the design system's `tokens/fonts.css` and sits second in `--font-sans`, so the browser resolves it per character — Geist keeps the Latin, Noto takes what Geist lacks. **Still open on mobile:** React Native has no per-codepoint fallback and its components read `theme.type.families.sans`, which is the single primary family (`"Geist"`), not the stack. `F3-13` covers this too — *on a platform without automatic per-codepoint fallback, script runs are resolved explicitly* — and it belongs to **`T-FPLAT-007`**, along with `F3-17`'s per-script line height, which no token expresses yet.
2. **An option card cannot declare its own language.** `OptionCardGroup` takes no per-option `lang`, so a screen reader running in English announces मराठी under English pronunciation rules — the accessible name failing at the one point `F3-03` cares about. The fix belongs in the component.
3. **No `Skeleton` component and no skeleton-duration token.** The system states a 1.4 s shimmer and ships the keyframe, but no token carries the duration; the nearest is `--dur-ambient` at 500 ms, which this screen uses rather than transcribing 1.4 s onto a frame.


## Requirements (verbatim)

### From `docs/prd/foundations/F3-localization.md`

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
