> ## ℹ️ Historical note, superseded on two counts
>
> Written 2026-08-07 and still broadly accurate about what the offline removal changed. Two
> things have moved since, and this file was not updated: the suite is **150 screens** (this
> file says 149 remaining), and the V1 scope lock of 2026-08-15/16 means only **95** of them are
> designed before launch. `START-HERE.md` and `BUILD-ORDER.md` are the live instructions.

# Screens — what the offline removal changes

Owner decision, 2026-08-07. The app requires a live connection. This file covers what to do with
screens already designed, and what changes for the 149 still to come.

---

## 1. `SCR-SHELL-01` — the one screen already built

**Redraw it. Don't amend it.** Offline wasn't a detail on this screen; it was one of its primary
elements.

What was in the approved mobile frame and is now gone:

| Element | Why it goes |
|---|---|
| The **sync strip** under the top bar — *"3 surveys waiting · 47 photos · will upload on Wi-Fi"*, *"counts measured on this phone"*, *"Last sync 10:42 AM"* | `F4-22`, the global indicator, is deleted. Nothing is ever waiting. |
| Its **tap target** → the sync centre | `SCR-SHELL-04` no longer exists |
| The **`offline`** state | no screen has one now |
| The **`all-synced-quiet`** state | there is no sync to be quiet about |
| Alternates **1b** (one status line) and **1c** (indicator docked in the thumb zone) | both were placements for the indicator |

The brief is already updated — nine frames now, not eleven, and the amendment is recorded at the
bottom of it.

**What survives untouched**, and it's most of the screen: the top bar with wordmark and tenant
name, search and bell, the `My Day` title with the preset switcher, the availability pill, the
record cards with their provenance dots and words, the arc bar with the raised centre action and
its role-adaptive verb, and all six write-back decisions.

**Practically:** start a fresh session, paste the current context file and the amended brief, and
say *"this replaces an earlier pass — the sync strip and the offline states are gone from the
product."* Don't try to patch the old session; it holds a brief that no longer exists.

The page-header row loses the sync strip that sat above it, so the availability pill and the title
now have more room than the approved design assumed. That is the one thing genuinely worth
re-deciding rather than reproducing.

## 2. Every other screen — what changed in the loop

**The `offline` base state is gone.** Message 3 in `START-HERE.md` says *"the four base states
(loading, empty, error, offline)"*. It is now **three**: loading, empty, error.

That is a real reduction: **160–190 state frames** across the 149 remaining screens, roughly 12%
of the total design work, deleted rather than drawn.

Also gone from the briefs, so don't draw them if a stale copy still mentions one:
`offline-export-refused` · `offline-draft-provisional` · `offline-edit-refused` ·
`offline-share-failed` · `late-sync-arrival` · `upload-waiting-connection` · `team-offline` ·
`last-known` · every staleness or freshness banner · every queued/unsynced marker · every
last-synced time.

**One shared offline screen replaces all of it.** When the connection drops, the product shows one
full-screen state — the same one everywhere. It is a design-system component (see
`design/CLAUDE-DESIGN-PROMPT-9.md`), not something any screen designs for itself.

## 3. The single exception: photographs

Photos captured in the field are held on the device and upload when the connection returns. This
is the only deferred work left in the product.

**It appears on exactly one screen: `SCR-M04-07` (Guided Capture)** — a waiting count and a retry,
inline. No other screen mentions it. No global indicator, no sync centre, no badge on a nav item.

If any brief other than `SCR-M04-07` asks you to show upload status, that is residue from the old
model — don't draw it, and tell me so I can clean the brief.

## 4. What did *not* change

Worth stating, because a designer reading a stale brief may over-correct:

- **Provenance tiers are untouched.** Every user-visible number still carries measured / derived /
  estimated / assumed, and the Q59 date rule still applies. The only thing that died is the
  *provisional-from-cache* label, because there is no cache.
- **Money-never-stale survives.** It is `F8-12` and `F8-13`, not an offline rule — a figure whose
  upstream inputs changed is still labelled provisional.
- **The concurrency law survives** at `F4-14` … `F4-19`: versioned-append surveys, single-editor
  designs with a server version check, per-field last-writer-wins with a recoverable activity log.
  Two people editing at once is an *online* problem and always was.
- **`F4-27` survives**: a warning never disables a primary action.
- **Everything from rounds 6–8** — the contrast fix, the type floor, `--text-inverse`,
  `--mark-subtle` — is unaffected.

## 5. Order of work

1. Send `design/CLAUDE-DESIGN-PROMPT-9.md` to the **design system** project. Do this first — the
   offline screen has to exist before any screen can reference it, and `OfflineBanner` has to go
   before someone reaches for it.
2. Redraw `SCR-SHELL-01` in a fresh session.
3. Continue down the register from `SCR-SHELL-02`. It is **150 screens** now, and the progress
   command still works: `grep -c '| pending |' prd/registers/screens.md`.
