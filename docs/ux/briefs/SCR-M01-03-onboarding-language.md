# SCR-M01-03 · Onboarding — Language

First-run language choice; each language listed in its own script and name; defaults to device language.

**Module:** M01 · **Personas:** All personas · **Context of use:** first run, on both platforms — this is the moment a new user's language is most likely wrong (F3 §F3.1 behavior detail). The personas most likely to work in Hindi or Marathi — Survey Engineer, Field Technician, Installation Team Member — are the personas who live on the phone (F3 §2), so this step is mobile-first in practice. Language is a per-user setting; no tenant configuration sets or restricts it (F3-02 context).

## Entry & exit

Reached from: onboarding on first run (F3-03) — for both the signing-up owner and an invited employee's first sign-in ("a user has no language preference recorded yet… the picker is the first-run step that resolves it" — F3 §F3.1 edge list). **Decided in design 2026-08-28: this is the first step of onboarding proper — the first screen after identity exists.** For a signing-up owner, immediately after the company is created on `SCR-M01-02`. **An invited employee does NOT reach this screen** (owner ruling 2026-08-31): `M01 §M01.2`'s acceptance pins their corridor as invite landing → name and photo → role card → their home, and `F3-03` requires that every user can **reach** a picker at first run, not that every user is given a screen. The invitee reaches it as the language control on `SCR-M01-09`, where the choice starts travelling with their profile. The reason is structural: language is a **per-user** setting (`F3-02`), so there is no user to record it against until identity is established. **It has no back control** — the step behind it is authentication, and returning there would mean signing out. Leads to: the rest of onboarding; the same picker lives permanently in Profile & Preferences (SCR-M01-11).

**Further decisions made in design (2026-08-28) — later screens inherit them.**

1. **The ghost language control in `SCR-M01-01` and `SCR-M01-02` chrome is not this picker, and does not duplicate it.** Before onboarding the app runs on the device's language with nothing saved, and that control exists for a shared field phone. **This screen is the one that records the preference.** Once recorded, the permanent home is Profile & preferences (`SCR-M01-11`), which this screen names in words.
2. **Choosing applies immediately; Continue only moves on.** No Save control — the screen redrawing in the language just touched is the only honest confirmation that the choice took, and it is the same behaviour `device-language-default` describes.
3. **The device default is stated, not merely pre-selected.** A ring and a filled dot say *this is chosen*; they cannot say *and you did not choose it*. So the device's language carries a word in a neutral pill — deliberately never the accent that selection uses. Two channels, both persistent content, neither a colour alone.
4. **No count of the set, anywhere.** Nothing may assume the size of the language set and it is expected to grow, so no copy says how many languages there are. Growth is answered structurally: the list is the scroll region and the primary sits below it.
5. **No step counter and no `Stepper`.** The onboarding sequence's length is not pinned by the PRD, so a counter would put a number on screen that nobody has decided — a transcription with no honest provenance.
6. **Nothing loads on this screen, so it has no loading frame** (owner ruling 2026-10-11). The language set ships inside the app (`F3-01`: a product-level list), so no request stands between the person and the list. The one wait is Continue's own save, and the button shows it.
7. **`empty` means *nothing to choose between*, not *nothing arrived*.** The second is a failure and already has the error frame. Onboarding **skips this step when there is nothing to choose** — the frame exists because a step that can render must be specified, not because a user should meet it.
8. **The error is Continue's save failing, and it is a corridor, not a wall** (owner ruling 2026-10-11). The list cannot fail to arrive — it is in the app — so the one failure is that the step did not save. One banner says what went wrong and what fixes it, with two full-size routes: try again, or continue anyway. Continuing anyway keeps the language already chosen, and the step is asked again at the next sign-in. It names no connection: a lost connection is the one shared full-screen surface the design system owns, and answering it here would be offline residue.
9. **No flag ever stands in for a language.** A flag is a country. It is the classic character-as-icon substitution `F7-19`/`F7-42` exists to stop.
10. **A device language outside the set is not named** (owner ruling 2026-10-11). A phone cannot name a language it ships no data for, and web and phone say the same thing. The notice says the device's language is not in HelioGrid yet and that the app started in English; the English card carries the pill `Chosen for you`.
11. **One word for the device at both widths.** The pill reads `Your device's language`. No frame says *phone* or *computer*, so a browser on a phone and a 1536 window never contradict their own frame.

**Build note — design-system gaps this screen found** are recorded once, in `packages/ui/CLAUDE.md` §"Known component gaps", which loads when anyone opens that folder. A screen brief is the wrong home for them: nobody building a component reads one.

1. **The type stack named no Devanagari face — half fixed 2026-08-28, half still open.** `--font-sans` was `"Geist","Inter",…` and Geist has no Devanagari coverage, so हिन्दी and मराठी rendered in whatever the operating system supplied. This is `F3-13`'s own words — *never through the operating system's fallback* — and the face was already chosen by owner ruling: Noto Sans Devanagari. **Fixed for web:** the face is declared in the design system's `tokens/fonts.css` and sits second in `--font-sans`, so the browser resolves it per character — Geist keeps the Latin, Noto takes what Geist lacks. **Still open on mobile:** React Native has no per-codepoint fallback and its components read `theme.type.families.sans`, which is the single primary family (`"Geist"`), not the stack. `F3-13` covers this too — *on a platform without automatic per-codepoint fallback, script runs are resolved explicitly* — and it belongs to **`T-FPLAT-007`**, along with `F3-17`'s per-script line height, which no token expresses yet.
2. **An option card declares its own language — fixed.** `OptionCardItem.lang` carries each option's own tag, so a screen reader running in English speaks मराठी under Marathi rules. Every language card sets it.
3. **No `Skeleton` component and no skeleton-duration token.** This screen no longer draws a placeholder (decision 6), so the gap is the design system's alone.


## Requirements (verbatim)

### From `docs/prd/foundations/F3-localization.md`

- **F3-03** (P0) — **Every user can reach a language picker, at first run and afterwards.** It appears in onboarding on first run and permanently in the user's own profile and preferences — reachable by every persona on both platforms. It lists each language **in that language's own script and name, never translated into the current language**, and it defaults to the device's language when that language is in the set.

## States

Base: **loading** — no frame: nothing waits on a request before this screen draws (decision 6) · **empty** — nothing to choose between (decision 7) · **error** — Continue's save failed (decision 8).

Screen-specific:

- **device-language-default** — the device's language is in the set, so the picker defaults to it and the app renders in it without the user's intervention (F3-03; F3 §F3.1 acceptance).
- **device-language-not-in-set** — the picker defaults to English and stays fully available; the user is never blocked from choosing among the languages that do exist (F3 §F3.1 edge list).

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2.

| Fact | Kind | Its form here |
|---|---|---|
| The question | action | the heading: `Choose your language` |
| Each language (`F3-03`) | action | one option card per language: its name in its own script, and nothing beside it |
| Which one is chosen | status | the card's ring and filled dot |
| A choice nobody made, and where it came from (decision 3) | status | the neutral pill on that card: `Your device's language`, or `Chosen for you` when the device's language is outside the set |
| The device's language is outside the set (decision 10) | status | ONE line in an informational block above the list: the device's language is not in HelioGrid yet, and the app started in English |
| Where the choice lives afterwards, and that it follows the person | help | the ask beside the heading — never in the reading flow |
| Moving on | action | the primary, `Continue`, with no line under it |
| Continue's save failed (decision 8) | error | one banner — what went wrong and what fixes it — and two full-size routes: `Try again` and `Continue anyway` |
| Nothing to choose between (decision 7) | data | the heading, ONE label–value row naming the one language, and `Continue` |

## Redesign owed

**What the design shows.** A `loading` frame and an `error` frame that wait on a list of languages, though no request fetches one. A not-in-set notice that names the device's language (`தமிழ் (Tamil)`). A pill that says *phone* on a frame whose copy says *computer*. Explaining paragraphs in the reading flow: the body copy under the heading on every frame, the line under Continue, the empty frame's body, the not-in-set notice's body and the 1536 error frame's closing line. An error block that reassures (*nothing you typed was lost*) on a screen with no typed field. Canvas notes and record lines that say an invited employee reaches this screen, that name the arc bar, that count two gaps and three audit lists, and that promise a frame *the next pass draws*. A language proof in Marathi only. No 1536 alignment numbers. A redraw audit whose passes name fields, a search pill, chips, back controls, footer items, tile actions, status chips and provenance marks — none of which this screen has. A record that counts *7 at 1536* where the board holds three.

**What is now required.**

1. The words follow `## Words on this screen` — print the word plan first, then redraw the words on every frame from it. No paragraph stays in the reading flow.
2. The `loading` frame is removed (decision 6). The record says loading has no subject on this screen and why.
3. The `error` frame, at 375 and 1536, is Continue's save failing (decision 8): one banner and the two routes `Try again` and `Continue anyway`. No reassurance paragraph.
4. The not-in-set frames, at 375 and 1536, do not name the device's language (decision 10).
5. The pill reads `Your device's language` at both widths (decision 11).
6. Who reaches this screen: only the signing-up owner, straight after the company is created on `SCR-M01-02`. Every canvas note and record line that says *both doors* or names the invited employee is corrected.
7. The stale canvas notes are corrected: the arc bar, the count of gaps and audit lists, the Devanagari gap (fixed for web, open on mobile), the option card's `lang` gap (fixed), and the promised next-pass frame.
8. The language proof: the 375 frame with the longest copy is drawn in Hindi and in Marathi, both measured — nothing clips, nothing overlaps, no fixed height.
9. The 1536 alignment numbers are printed for each 1536 frame: every region's left and right x, and the height of every sibling language card. The value-column x has no subject here, and the record says so.
10. The self-audit is run again from the context file, all five lists, the word inventory first. Every PASS names an element on this screen; a law with no subject here says so.
11. The record is rewritten to say only what the design is now, with a title that covers every state and one frame count that equals the board's.

## Data volume

The launch language set: three languages (English, Hindi, Marathi — F3-01 context), each listed in its own script and name. The picker's own labels are translated, but the language names inside it are not, and the picker must remain legible when it lists a script the current language does not use (F3 §F3.1 localization notes). Nothing in the product may assume the size of the set — it is expected to grow (F3-01 context).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
