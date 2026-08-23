> ## ✅ EXECUTED 2026-08-07 — historical record, not an instruction
>
> This plan was carried out on 2026-08-07 (owner ruling `Q61`) and the follow-up waves completed
> on 2026-08-15. **Do not execute it again.** It is written in the imperative because it was a
> plan; every number in it is the number as it stood before the work, and several are now stale
> by design — §5's "every number that is currently a lie" is itself a table of superseded
> figures. Current counts live in `prd/registers/screens.md` §1 and §4, and `gates.py` proves
> them on every run.
>
> One correction worth stating rather than editing away: §7 asserts `SCR-SHELL-01` is designed.
> It is not — the register has it `pending`, and it is the first screen of the run.

# Offline / sync removal — execution plan

**Owner decision, 2026-08-07.** The offline/sync capability is removed from HelioGrid V2. The app
requires a live connection. Nothing is kept as deprecated.

Surveyed by 11 agents over ~110 files: **827 changes** — 302 KILL, 349 EXCISE, 54 DECITE,
122 DANGER (many of which the reconcile pass downgraded; see §2).

---

## 1. The decisions, exactly as ruled

| # | Decision | Ruled |
|---|---|---|
| D1 | App **requires a live connection**. No cache, no local-first reads, no sync engine, no queue, no staleness, no conflict resolution. Offline becomes an ordinary network-error state. | owner |
| D2 | `prd/foundations/F4-offline-and-sync.md` (747 lines, 35 rows) **deleted whole** — *after* §3's rehoming | owner |
| D3 | `ux/briefs/SCR-SHELL-04-sync-center.md` **deleted** — the screen ceases to exist | owner |
| D4 | `ux/briefs/SCR-SHELL-05-update-required.md` **deleted** — it existed only for `F4-35` | owner |
| D5 | **Carve-out: photo capture queues locally.** Photos taken in the field are held on the device and upload when signal returns. One queue, one direction, no conflicts, no merge. This is the *only* survivor of the offline layer. | owner |
| D6 | `OV-39` (competitive moat) and `BM-05` (public pricing-page feature) **both deleted** — the product no longer does it, so it cannot be advertised | owner |
| D7 | **Photo upload status lives on the capture screen**, not a global surface. `SCR-M04-07` shows waiting-count and retry inline. No sync centre, no global indicator. | Claude, following D3+D5 |

**Counts after:** 152 → **150 screens** · 1,699 → **1,664 requirement rows** · 374 → **365 tasks**.

---

## 2. What is NOT offline, and must survive

The single most important finding. **`F4` is not purely an offline document.** These rows govern
online behaviour and have no other home in the suite. Deleting `F4` whole destroys them silently.

| Row | What it actually says | Rehome to |
|---|---|---|
| `F4-04` | *"no device computes, assigns or finalises a money figure **or a business identifier**"* — grep returns **exactly one hit in the whole PRD** | new platform-integrity section |
| `F4-07` | Submission idempotency. Its own text: *"hold from the product's first release, **independent of when the offline layer lands**"* | same |
| `F4-14` `F4-15` `F4-16` `F4-17` `F4-19` | The **concurrency law** — two simultaneous *online* editors, single-editor + server version check, per-field last-writer-wins *"so a 'lost' concurrent edit is always visible and recoverable from the log"*. `M05-09` and `M02-36` enforce it; nothing else defines it | new concurrency-policy section. **Rename `T-FPLAT-012`, do not delete it** |
| `F4-21` | *"nothing a field user captured is ever unrecoverable"* | F8 |
| `F4-25` | The "v2 — v1 kept" notice | M04 |
| `F4-27` | *"a warning never disables a primary action"* | F7 |
| `M04-48` | *"A survey interrupted by a dead battery or a killed application is restored exactly as it was, with nothing lost"* — source `S4.wrong.8` has **no other disposition**. `T-M04-016` must not be killed wholesale | stays in M04 |
| `M11-06` | *"There is **no offline money in this product**, on any surface, at any tier"* — already states the new rule. **Survives as the model** | stays |

`F4-33` / `F4-34` need **no** rehoming — `M12-24`, `M12-28`, `M12-22`, `M12-46`, `M12-53` and
`BM-32` already own the billing guarantees independently.

### Downgraded by the reconcile pass — do not treat as DANGER
- **`F7` line 59** and **`F7-45`'s SRC quote** — true statements about read-only artifacts. **NO CHANGE.** Editing them is the only way to break them.
- **`F6-07`** — clean EXCISE, cut `; offline reads sync per F4's conflict rule…`
- **`M06-25`** — EXCISE plus a provenance footnote
- **`F7-36` renumbering** — the premise was wrong. Grep for `Principle 8`…`Principle 12` outside F7 returns **zero** citations.

---

## 3. Execution order — rehome before delete

**Wave 1 — rehome (must be first).** Create the destinations in §2, move the rows, repoint every
citation. `T-FPLAT-012` renamed, not deleted. Nothing is deleted in this wave.

**Wave 2 — laws by ruling, not by edit.** `N10` is carried under *"never renumber, never reword"*
and appears in **three** places that must change in one pass or the design context contradicts its
own foundation in front of 150 sessions:
- `prd/foundations/F7-design-language.md` — `F7-23` inline (line 404)
- the same file's verbatim blockquote (line 418)
- `ux/claude-design-context.md:54`

Precedent exists and works: **`R19-B` amended `N3` by owner ruling recorded at `F7-10`**; `R19-A`
struck a DoD item in `F7-43`'s SRC cell. Use it. New ruling **`Q61`** in `open-questions.md`.
Completion-contract item 3 (offline visible state) is struck the same way.

**Wave 3 — freeze the disposition list, then edit.** §1 and §4 of `screens.md` cannot be recomputed
from `F4` alone; ~12 non-`F4` kills move different columns. Compute once, from the frozen list.

**Wave 4 — mechanical bulk.** 150 briefs, tasks, module docs. EXCISE with verbatim before/after.

**Wave 5 — supersede the rulings.** `Q15`, `Q16`, `Q20`, `Q22` are closed owner decisions with
dates. An edit cannot retire a ruling — add a 2026-08-07 supersession line to each.

**Wave 6 — re-baseline the verification machinery.** See §5.

---

## 4. Registers: replace, never delete

`prd/registers/traceability.md`'s founding invariant is *"every key dispositioned exactly once"*,
and `_process/extraction/ux-gaps.md`'s header says in terms **"never delete rows"**.

**18 ledger keys orphan** if the Task 10 block is deleted: 15 of the 17 `DOC06.*` keys have their
only disposition there, plus `UXG-10`, `DOC14.offline-scope` and `R14`. Line 546 asserts
*"`DOC06.*` is disposed of here in full — all seventeen rows"*, and §13 gates on it.

**Use the file's own `excluded` pattern** with a no-PRD-carrier note. Mark, don't remove.
Same for `CG-moat.3` and `CG-matrix.3` once `OV-39` goes.

---

## 5. Re-baselining — every number that is currently a lie

| File | Now | After |
|---|---|---|
| `screens.md` §1 | `152 / 1699 / …` | `150 / 1664 / …` — **all columns move**, compute from the frozen list |
| `screens.md` §4 | union `1699/1699` · proposals `226` · tasked `1419` · LAW `280` | `1664/1664` · `221` · `1384` · `279` |
| `prd/_process/verification-report.md` | Documents 30 · rows 1,267 · `F4 35` · 1,723 ledger keys 100% | 29 · 1,232 · term deleted · **100% is false unless keys are re-dispositioned rather than deleted** |
| `design/CLAUDE-DESIGN-PROMPT.md:24` | `152 screens, 1,515 states, 1,699 requirements` | `150 / ~1,340 / 1,664` — the state count drops by **160–190** |
| `START-HERE.md` | `152 today`, `156 → 4`, "repeat it 151 more times", SHELL `6 screens`, two hard-coded line numbers | 150 · 154 · 149 · 4 · both pointers reseat |
| `prd/00-README.md` | F4 doc-map row · 152 briefs · 1,699 rows · 374 tasks in 19 files | row deleted · 150 · 1,664 · 365 |
| `scratchpad/rows.json`, `screens.json` | 1,699 / 152 — **the gates' ground truth** | regenerate, or every gate passes while lying |

`next-screen.py` self-corrects from the register — **except** it prints `(no DESIGN line found)`
silently if a register row and its `DESIGN:` line drift. Check that explicitly.

Note: *"the four base states"* appears **47 times, not 149** — and screen tasks in SHELL, M01, M02,
M04, M07–M10, M12 and M13 don't carry it at all. `tasks/F-core.md:400` claims *"every screen task
in this suite carries"* it, which is already false today.

---

## 6. Design system — the removal leaks back in without this

`design/ds-source/` is a read-only snapshot, but the **live** Claude Design package still ships
`OfflineBanner` (`.jsx`, `.d.ts`, `.prompt.md`), exports it from `ui_kits/mobile/shell.jsx`,
renders `<OfflineBanner count={3} />` in `feedback.card.html`, lists it in `_ds_manifest.json` and
`readme.md`, and `forms.card.html` demos a `Switch label="Work offline"`. `Banner` carries a
`staleness` kind; `Sheet`, `DataTable`, `ChartFrame`, `MapSurface` and `Timeline` all take an
`offline` prop.

**All 150 remaining sessions load that package.** Nothing in the PRD can retire it. See
`design/CLAUDE-DESIGN-PROMPT-9.md` for the removal prompt.

---

## 7. Screens already built

**`SCR-SHELL-01`** is the only screen designed so far, and offline was central to it: the sync
strip, its counts sentence, the last-sync time, and the `offline` state. **It needs redrawing, not
amending.** See `OFFLINE-REMOVAL-SCREEN-NOTES.md`.
