# docs/archive — frozen history

Nothing here describes the current system. Read these files to learn **why** a decision was
made, never to learn **what is true now**. Current truth: [`../README.md`](../README.md) for
architecture, `prd/` for product.

Nothing here is a gate, and nothing here should be cited by new work.

| Folder | What it is |
|---|---|
| [`research/`](research/) | The exploration corpus behind the original decisions — market, stack, voice, 3D, sync. **Every file carries a status banner on its first line; read the banner before the file.** A few were once delegated binding authority, and two recommend a stack that was later rejected. |
| [`spikes/`](spikes/) | Week-1 verification spikes S1–S6 with their verdicts. S5 (Exotel BYO/DTMF) still has findings the owner has not reviewed. |
| [`offline-removal/`](offline-removal/) | The offline/sync capability removal (owner ruling `Q61`), executed 2026-08-07 with follow-up waves to 2026-08-15. Written in the imperative because it was a plan — **do not execute it again.** |
| [`design/`](design/) | The design-system gap register: 57 gaps, closed out 2026-08-17. |

## What moved, and when

These files were reorganised on **2026-08-24**. They previously sat at `docs/research/`,
`docs/spikes/`, `design/`, and the repo root:

| Was | Now |
|---|---|
| `docs/research/` | `docs/archive/research/` |
| `docs/spikes/` | `docs/archive/spikes/` |
| `OFFLINE-REMOVAL-PLAN.md` | `docs/archive/offline-removal/plan.md` |
| `OFFLINE-REMOVAL-SCREEN-NOTES.md` | `docs/archive/offline-removal/screen-notes.md` |
| `design/DESIGN-SYSTEM-GAPS.md` | `docs/archive/design/design-system-gaps.md` |

The rest of the old top-level `design/` folder — the round prompts `CLAUDE-DESIGN-PROMPT-*.md`,
the `round-13`…`round-17` paste files, and the `_audit/` JSONs — was **deleted** in the same
pass. Nothing outside that folder linked to it. It is recoverable from git history.

Prose inside these archived files still names the pre-move paths. That is left as written:
they are historical records, and rewriting them would edit history to match a folder move.
